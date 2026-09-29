import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { verifyCurrentModerator } from "@/lib/moderation/service";

export async function POST(req: Request) {
  try {
    const { isModerator } = await verifyCurrentModerator();
    if (!isModerator) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Product image cannot exceed 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";
    const ext = mimeType.split("/")[1] || "jpeg";
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 6)}.${ext}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isRealSupabase =
      Boolean(supabaseUrl) &&
      !supabaseUrl.includes("placeholder") &&
      !supabaseUrl.includes("your-project.supabase.co");

    // 1. Try Supabase Storage if configured
    if (isRealSupabase) {
      try {
        const admin = createAdminSupabaseClient();
        const { error: uploadError } = await admin.storage
          .from("product_images")
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = admin.storage.from("product_images").getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              imageUrl: publicUrlData.publicUrl,
            });
          }
        } else {
          console.warn("[Upload Image] Supabase storage upload warning, using data URL fallback:", uploadError.message);
        }
      } catch (storageErr) {
        console.warn("[Upload Image] Supabase exception, using data URL fallback:", storageErr);
      }
    }

    // 2. Resilient Base64 Data URL fallback for dev and offline mode
    const base64Image = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
    });
  } catch (err) {
    console.error("[Upload Image] API exception:", err);
    return NextResponse.json({ success: false, error: "Failed to upload product image." }, { status: 500 });
  }
}
