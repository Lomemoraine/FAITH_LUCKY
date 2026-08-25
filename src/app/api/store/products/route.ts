import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store/service";

export async function GET() {
  try {
    const products = await getStoreProducts();
    return NextResponse.json({ success: true, products });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load store products." }, { status: 500 });
  }
}
