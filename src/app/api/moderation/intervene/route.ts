import { NextResponse } from "next/server";
import { postClinicalIntervention } from "@/lib/moderation/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, responseText, invitePrivateChat, counselorName } = body;

    if (!caseId || !responseText) {
      return NextResponse.json(
        { success: false, error: "Case ID and clinical response text are required." },
        { status: 400 }
      );
    }

    const result = await postClinicalIntervention({
      caseId,
      responseText,
      invitePrivateChat: Boolean(invitePrivateChat),
      counselorName,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      message: "Clinical response posted successfully.",
      sessionId: result.sessionId,
    });
  } catch (err) {
    console.error("[Moderation Intervene API] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal error processing clinical intervention." },
      { status: 500 }
    );
  }
}
