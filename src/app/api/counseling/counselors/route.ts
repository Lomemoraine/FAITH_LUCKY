import { NextResponse } from "next/server";
import { getVerifiedCounselors } from "@/lib/counseling/service";

export async function GET() {
  try {
    const counselors = await getVerifiedCounselors();
    return NextResponse.json({ success: true, counselors });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load counselors." }, { status: 500 });
  }
}
