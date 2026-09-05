// =============================================================================
// ConMart — Admin Category & Fee Management Server Actions
// =============================================================================

"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

async function verifyAdmin() {
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return { isAuthorized: false, error: "Unauthorized" };
  }

  const user = await db.user.findUnique({
    where: { authId: authUser.id },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { isAuthorized: false, error: "Only administrators can manage categories." };
  }

  return { isAuthorized: true, user };
}

export async function getAdminCategoriesAction() {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  const categories = await db.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return {
    success: true,
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      unlockFee: Number(c.unlockFee),
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    })),
  };
}

export async function updateCategoryFeeAction({
  categoryId,
  unlockFee,
}: {
  categoryId: string;
  unlockFee: number;
}) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  if (unlockFee < 0) {
    return { success: false, error: "Unlock fee cannot be negative." };
  }

  await db.category.update({
    where: { id: categoryId },
    data: { unlockFee: new Prisma.Decimal(unlockFee) },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/buyer");
  revalidatePath("/seller/enquiries");

  return { success: true };
}

export async function toggleCategoryActiveAction({
  categoryId,
  isActive,
}: {
  categoryId: string;
  isActive: boolean;
}) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  await db.category.update({
    where: { id: categoryId },
    data: { isActive },
  });

  revalidatePath("/admin/command-center");
  revalidatePath("/buyer");

  return { success: true };
}
