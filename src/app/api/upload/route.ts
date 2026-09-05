// =============================================================================
// ConMart — Product Image Upload API Route
// =============================================================================
// Accepts multipart FormData containing product images, validates file type
// and size, uploads to Supabase Storage with graceful local filesystem fallback
// to public/uploads/products, and returns the public URL.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getAuthenticatedUser, createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates image buffer magic bytes against known binary signatures.
 * Prevents disguised executable, script, or SVG/HTML file uploads.
 */
function validateImageMagicBytes(buffer: Buffer): { valid: boolean; extension: string } {
  if (buffer.length < 12) {
    return { valid: false, extension: "" };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, extension: ".jpg" };
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, extension: ".png" };
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, extension: ".gif" };
  }

  // WebP: RIFF (bytes 0-3) ... WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, extension: ".webp" };
  }

  return { valid: false, extension: "" };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate caller
    const authUser = await getAuthenticatedUser();
    if (!authUser) {
      return NextResponse.json(
        { error: "Authentication required to upload media." },
        { status: 401 }
      );
    }

    // 2. Verify Role (Seller or Admin only)
    const dbUser = await db.user.findUnique({
      where: { authId: authUser.id },
      select: { id: true, role: true },
    });

    if (!dbUser || (dbUser.role !== "SELLER" && dbUser.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden. Only registered sellers and administrators can upload product media." },
        { status: 403 }
      );
    }

    // 3. Extract and check file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided in request." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // 4. Read bytes and validate real magic numbers
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const { valid, extension } = validateImageMagicBytes(buffer);

    if (!valid) {
      return NextResponse.json(
        {
          error:
            "Invalid or unverified image file. Please upload a genuine JPEG, PNG, WebP, or GIF image.",
        },
        { status: 400 }
      );
    }

    // 5. Generate secure random filename
    const randomSuffix = crypto.randomBytes(12).toString("hex");
    const filename = `mat-${Date.now()}-${randomSuffix}${extension}`;

    let publicUrl: string | null = null;

    // 6. Attempt Supabase Storage first
    try {
      const supabase = await createSupabaseServerClient();
      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filename, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError) {
        const { data } = supabase.storage.from("products").getPublicUrl(filename);
        if (data?.publicUrl) {
          publicUrl = data.publicUrl;
        }
      } else {
        console.warn("Supabase storage upload returned error, using local fallback:", uploadError?.message || uploadError);
      }
    } catch (sbErr) {
      console.warn("Supabase storage exception, using local fallback:", sbErr);
    }

    // 7. Resilient Fallback: persist locally in public/uploads/products
    if (!publicUrl) {
      try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        await fs.promises.mkdir(uploadDir, { recursive: true });
        const localFilePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(localFilePath, buffer);
        publicUrl = `/uploads/products/${filename}`;
      } catch (fsErr) {
        console.error("Local file write error:", fsErr);
        return NextResponse.json(
          { error: "Failed to persist uploaded image." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to process and upload image." },
      { status: 500 }
    );
  }
}
