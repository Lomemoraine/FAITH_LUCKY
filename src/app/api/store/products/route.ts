import { NextResponse } from "next/server";
import {
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
} from "@/lib/store/service";
import { verifyCurrentModerator } from "@/lib/moderation/service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const products = await getStoreProducts(includeInactive);
    return NextResponse.json({ success: true, products });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load store products." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { isModerator } = await verifyCurrentModerator();
    if (!isModerator) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, priceKes, carePerk, therapySessionsCount, category, imageUrl, inStock } = body;

    if (!name || !description || priceKes === undefined) {
      return NextResponse.json(
        { success: false, error: "Name, description, and price are required." },
        { status: 400 }
      );
    }

    const product = await createStoreProduct({
      name,
      description,
      priceKes: Number(priceKes),
      carePerk,
      therapySessionsCount: Number(therapySessionsCount) || 1,
      category,
      imageUrl,
      inStock: inStock !== false,
    });

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("[Store Products API] POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create product." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { isModerator } = await verifyCurrentModerator();
    if (!isModerator) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    const updated = await updateStoreProduct(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error("[Store Products API] PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { isModerator } = await verifyCurrentModerator();
    if (!isModerator) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Product ID is required." }, { status: 400 });
    }

    await deleteStoreProduct(id);
    return NextResponse.json({ success: true, message: "Product deleted successfully." });
  } catch (err) {
    console.error("[Store Products API] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete product." }, { status: 500 });
  }
}
