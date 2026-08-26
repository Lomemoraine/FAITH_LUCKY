import { NextResponse } from "next/server";
import { deleteIdentityAction } from "@/lib/community/service";

export async function DELETE() {
  try {
    const result = await deleteIdentityAction();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reset identity" }, { status: 500 });
  }
}
