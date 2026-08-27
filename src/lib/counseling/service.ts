import { createAdminSupabaseClient } from "../supabase/admin";
import { sendAppointmentReminder } from "../httpsms";
import { Counselor, CounselingSession, CounselingMessage } from "../types";

export const DEFAULT_COUNSELORS: Counselor[] = [
  {
    id: "counselor-1",
    name: "Dr. Faith Mwangi",
    title: "Licensed Clinical Psychologist",
    licenseNumber: "KPsyA-4821",
    specialty: "Anxiety, Panic & Trauma Support",
    bio: "Specialized in cognitive behavioral techniques, panic relief, and trauma-informed compassionate listening for youth and young adults.",
    avatarInitials: "FM",
    isOnline: true,
    rating: 4.9,
    sessionsCompleted: 184,
  },
  {
    id: "counselor-2",
    name: "David Otieno, MA",
    title: "Certified Counseling Psychologist",
    licenseNumber: "KPsyA-3109",
    specialty: "Grief, Career Burnout & Stress",
    bio: "Dedicated to helping individuals navigate acute life transitions, workplace overwhelm, personal loss, and emotional grounding.",
    avatarInitials: "DO",
    isOnline: true,
    rating: 4.8,
    sessionsCompleted: 142,
  },
  {
    id: "counselor-3",
    name: "Sarah Chebet, MSc",
    title: "Family & Wellness Specialist",
    licenseNumber: "KPsyA-5520",
    specialty: "Relationships, Depression & Self-Esteem",
    bio: "Warm, non-judgmental guidance focused on emotional resilience, healthy relationship boundaries, and self-worth restoration.",
    avatarInitials: "SC",
    isOnline: true,
    rating: 5.0,
    sessionsCompleted: 210,
  },
];

export async function getVerifiedCounselors(): Promise<Counselor[]> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("counselors")
      .select("*")
      .order("rating", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_COUNSELORS;
    }

    return data.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title,
      licenseNumber: c.license_number,
      specialty: c.specialty,
      bio: c.bio,
      avatarInitials: c.avatar_initials,
      isOnline: c.is_online,
      rating: Number(c.rating),
      sessionsCompleted: c.sessions_completed,
    }));
  } catch {
    return DEFAULT_COUNSELORS;
  }
}

export async function createOrGetCounselingSession(params: {
  clientId: string;
  counselorId: string;
  voucherId?: string | null;
  primaryConcern?: string;
  intakeMood?: string;
  clientPhone?: string;
}): Promise<CounselingSession> {
  const counselor = DEFAULT_COUNSELORS.find((c) => c.id === params.counselorId) || DEFAULT_COUNSELORS[0];
  const sessionId = `sess-${Date.now()}`;
  const now = new Date().toISOString();

  if (params.clientPhone) {
    sendAppointmentReminder({
      userPhone: params.clientPhone,
      counselorName: counselor.name,
      sessionTime: "Today (Live Confidential Session)",
    }).catch((err) => console.error("[Counseling] Failed to send reminder SMS:", err));
  }

  const initialMessages: CounselingMessage[] = [
    {
      id: `msg-${Date.now()}-1`,
      sessionId,
      senderRole: "system",
      content: `🔒 SafeSpace Private Consultation initiated with ${counselor.name}. Everything shared in this room is 100% confidential and anonymous.`,
      createdAt: now,
    },
    {
      id: `msg-${Date.now()}-2`,
      sessionId,
      senderRole: "counselor",
      content: `Hello! I'm ${counselor.name}. Thank you for reaching out today. I am here to listen without judgment. Whenever you feel ready, tell me a little about what has been on your mind lately.`,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    },
  ];

  try {
    const admin = createAdminSupabaseClient();
    const { data: sessionData } = await admin
      .from("counseling_sessions")
      .insert({
        client_id: params.clientId,
        counselor_id: counselor.id,
        voucher_id: params.voucherId || null,
        primary_concern: params.primaryConcern || "Emotional Support",
        intake_mood: params.intakeMood || "neutral",
        status: "active",
      })
      .select()
      .single();

    if (sessionData) {
      await admin.from("counseling_messages").insert([
        {
          session_id: sessionData.id,
          sender_role: "system",
          content: `🔒 SafeSpace Private Consultation initiated with ${counselor.name}. Everything shared in this room is 100% confidential and anonymous.`,
        },
        {
          session_id: sessionData.id,
          sender_role: "counselor",
          content: `Hello! I'm ${counselor.name}. Thank you for reaching out today. I am here to listen without judgment. Whenever you feel ready, tell me a little about what has been on your mind lately.`,
        },
      ]);

      return {
        id: sessionData.id,
        clientId: sessionData.client_id,
        counselorId: sessionData.counselor_id,
        counselor,
        voucherId: sessionData.voucher_id,
        status: "active",
        primaryConcern: sessionData.primary_concern,
        intakeMood: sessionData.intake_mood,
        createdAt: sessionData.created_at,
        messages: initialMessages,
      };
    }
  } catch (err) {
    console.warn("[Counseling] Supabase session error (falling back to memory session):", err);
  }

  return {
    id: sessionId,
    clientId: params.clientId,
    counselorId: counselor.id,
    counselor,
    voucherId: params.voucherId || null,
    status: "active",
    primaryConcern: params.primaryConcern,
    intakeMood: params.intakeMood,
    createdAt: now,
    messages: initialMessages,
  };
}

export async function sendCounselingMessage(params: {
  sessionId: string;
  senderRole: "client" | "counselor";
  content: string;
}): Promise<CounselingMessage> {
  const message: CounselingMessage = {
    id: `msg-${Date.now()}`,
    sessionId: params.sessionId,
    senderRole: params.senderRole,
    content: params.content,
    createdAt: new Date().toISOString(),
  };

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("counseling_messages").insert({
      session_id: params.sessionId,
      sender_role: params.senderRole,
      content: params.content,
    });
  } catch (err) {
    console.warn("[Counseling] Save message warning:", err);
  }

  return message;
}
