import { NextResponse } from "next/server";
import {
  getVerifiedCounselors,
  createCounselor,
  updateCounselor,
  deleteCounselor,
} from "@/lib/counseling/service";
import { verifyCurrentModerator } from "@/lib/moderation/service";

export async function GET() {
  try {
    const counselors = await getVerifiedCounselors();
    return NextResponse.json({ success: true, counselors });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load counselors." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { isModerator } = await verifyCurrentModerator();
    if (!isModerator) {
      return NextResponse.json({ success: false, error: "Unauthorized admin access." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      title,
      specialty,
      bio,
      licenseNumber,
      isLicensed,
      showLicenseNumber,
      avatarInitials,
      isOnline,
      rating,
      sessionsCompleted,
    } = body;

    if (!name || !title || !specialty) {
      return NextResponse.json(
        { success: false, error: "Name, title, and specialty are required." },
        { status: 400 }
      );
    }

    const counselor = await createCounselor({
      name,
      title,
      specialty,
      bio: bio || "Licensed Kenya Board mental health professional offering compassionate guidance.",
      licenseNumber,
      isLicensed: isLicensed !== false,
      showLicenseNumber: Boolean(showLicenseNumber),
      avatarInitials,
      isOnline: isOnline !== false,
      rating: Number(rating) || 5.0,
      sessionsCompleted: Number(sessionsCompleted) || 0,
    });

    return NextResponse.json({ success: true, counselor });
  } catch (err) {
    console.error("[Counselors API] POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create counselor." }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Counselor ID is required." }, { status: 400 });
    }

    const updated = await updateCounselor(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Counselor not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, counselor: updated });
  } catch (err) {
    console.error("[Counselors API] PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update counselor." }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Counselor ID is required." }, { status: 400 });
    }

    await deleteCounselor(id);
    return NextResponse.json({ success: true, message: "Counselor deleted successfully." });
  } catch (err) {
    console.error("[Counselors API] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete counselor." }, { status: 500 });
  }
}
