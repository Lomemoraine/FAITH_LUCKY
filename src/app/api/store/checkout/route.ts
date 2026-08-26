import { NextResponse } from "next/server";
import { processMpesaCheckout } from "@/lib/store/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, phoneNumber, shippingAddress } = body;

    if (!productId || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Product ID and Phone Number are required." },
        { status: 400 }
      );
    }

    const result = await processMpesaCheckout({
      productId,
      phoneNumber,
      shippingAddress,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      voucher: result.voucher,
    });
  } catch (err) {
    console.error("[Store Checkout API] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error processing checkout." },
      { status: 500 }
    );
  }
}
