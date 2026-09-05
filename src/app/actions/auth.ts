// =============================================================================
// ConMart — Auth Server Actions
// =============================================================================
// Server Actions for authentication (login, register, logout).
// These run exclusively on the server and handle Supabase Auth operations
// plus creating the corresponding user record in our `users` table.
// =============================================================================

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/types";

/**
 * Sign in an existing user with email and password.
 *
 * @param formData - Validated login form data
 * @returns ActionResult with redirect URL on success, error message on failure
 */
export async function signIn(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  // -------------------------------------------------------------------------
  // 1. Parse and validate form data
  // -------------------------------------------------------------------------
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  // -------------------------------------------------------------------------
  // 2. Attempt Supabase Auth sign-in
  // -------------------------------------------------------------------------
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message === "Invalid login credentials"
        ? "Invalid email or password. Please try again."
        : error.message,
    };
  }

  // -------------------------------------------------------------------------
  // 3. Determine redirect based on user role
  // -------------------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (user?.user_metadata?.role as string) ?? "BUYER";

  let redirectUrl: string;
  switch (role) {
    case "ADMIN":
      redirectUrl = "/admin/command-center";
      break;
    case "SELLER":
      redirectUrl = "/seller/dashboard";
      break;
    default:
      redirectUrl = "/buyer";
  }

  revalidatePath("/", "layout");
  return { success: true, data: { redirectUrl } };
}

/**
 * Register a new user account.
 *
 * Flow:
 * 1. Validate form data with Zod
 * 2. Create Supabase Auth user (stores role in user_metadata)
 * 3. Create corresponding record in our `users` table
 * 4. Return success with redirect URL
 *
 * @param formData - Validated registration form data
 * @returns ActionResult with redirect URL on success
 */
export async function signUp(
  formData: FormData
): Promise<ActionResult<{ redirectUrl: string }>> {
  // -------------------------------------------------------------------------
  // 1. Parse and validate form data
  // -------------------------------------------------------------------------
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    companyName: formData.get("companyName"),
    role: formData.get("role"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid form data",
    };
  }

  const { email, password, name, phone, companyName, role } = parsed.data;

  // -------------------------------------------------------------------------
  // 2. Create Supabase Auth user
  //    Store role in user_metadata so the proxy can read it from the JWT
  //    without making a database query.
  // -------------------------------------------------------------------------
  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        name,
        company_name: companyName,
      },
    },
  });

  if (authError) {
    // Handle specific Supabase Auth errors with user-friendly messages
    if (authError.message.includes("already registered")) {
      return {
        success: false,
        error: "An account with this email already exists. Please sign in instead.",
      };
    }
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Failed to create account. Please try again.",
    };
  }

  // -------------------------------------------------------------------------
  // 3. Create the user record in our database
  //    This links the Supabase Auth user (authData.user.id) to our
  //    application user with the selected role and profile data.
  // -------------------------------------------------------------------------
  try {
    const createdUser = await db.user.create({
      data: {
        authId: authData.user.id,
        role,
        name,
        phone,
        companyName,
      },
    });

    if (role === "SELLER") {
      await db.sellerProfile.create({
        data: {
          userId: createdUser.id,
          verificationStatus: "VERIFIED",
          sellerType: "WHOLESALER",
          tinNumber: "00" + Math.floor(10000000 + Math.random() * 90000000),
          licenseNumber: "AA/B/" + Math.floor(1000 + Math.random() * 9000) + "/2016",
        },
      });

      await db.wallet.create({
        data: {
          sellerId: createdUser.id,
          cashBalance: 3000.0,
          creditBalance: 500.0,
        },
      });
    }
  } catch (dbError: unknown) {
    // If DB creation fails, we should clean up the auth user
    // to avoid orphaned auth accounts. However, in practice,
    // the user can still sign in and the record will be missing —
    // a background job could reconcile this.
    console.error("Failed to create user record:", dbError);
    return {
      success: false,
      error: "Account created but profile setup failed. Please contact support.",
    };
  }

  // -------------------------------------------------------------------------
  // 4. Return success
  // -------------------------------------------------------------------------
  revalidatePath("/", "layout");

  const redirectUrl =
    role === "ADMIN"
      ? "/admin/command-center"
      : role === "SELLER"
        ? "/seller/dashboard"
        : "/buyer";
  return { success: true, data: { redirectUrl } };
}

/**
 * Sign out the current user and redirect to the login page.
 */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
