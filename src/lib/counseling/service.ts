import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createAdminSupabaseClient } from "../supabase/admin";
import { AccessError } from "../auth/session";
import { Counselor, CounselingSession, CounselingMessage } from "../types";

const counselorInput = z.object({
  name: z.string().trim().min(1).max(120), title: z.string().trim().min(1).max(150),
  specialty: z.string().trim().min(1).max(250), bio: z.string().trim().min(1).max(3000),
  licenseNumber: z.string().trim().max(100).default(""),
  isLicensed: z.boolean().default(false), showLicenseNumber: z.boolean().default(false),
  avatarInitials: z.string().trim().max(5).optional(), isOnline: z.boolean().default(false),
  rating: z.number().min(0).max(5).default(0), sessionsCompleted: z.number().int().min(0).default(0),
});
type CounselorInput = z.input<typeof counselorInput>;
interface CounselorRow {
  id: string; name: string; title: string; specialty: string; bio: string;
  license_number: string; is_licensed: boolean; show_license_number: boolean;
  avatar_initials: string; is_online: boolean; rating: number; sessions_completed: number;
}
function mapCounselor(row: CounselorRow): Counselor {
  return { id: row.id, name: row.name, title: row.title, specialty: row.specialty, bio: row.bio,
    licenseNumber: row.license_number, isLicensed: row.is_licensed === true, showLicenseNumber: row.show_license_number === true,
    avatarInitials: row.avatar_initials, isOnline: row.is_online === true, rating: Number(row.rating), sessionsCompleted: row.sessions_completed };
}
function counselorPayload(input: CounselorInput) {
  const value = counselorInput.parse(input);
  if (value.isLicensed && !value.licenseNumber) throw new AccessError("A license number is required for a verified counselor.", 400);
  return { name: value.name, title: value.title, specialty: value.specialty, bio: value.bio,
    license_number: value.licenseNumber, is_licensed: value.isLicensed, show_license_number: value.showLicenseNumber,
    avatar_initials: value.avatarInitials || value.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
    is_online: value.isOnline, rating: value.rating, sessions_completed: value.sessionsCompleted };
}

export async function getVerifiedCounselors(includeUnverified = false): Promise<Counselor[]> {
  let query = createAdminSupabaseClient().from("counselors").select("*").order("name");
  if (!includeUnverified) query = query.eq("is_licensed", true).not("auth_user_id", "is", null);
  const { data, error } = await query;
  if (error) {
    if (["42703", "42P01", "PGRST204", "PGRST205"].includes(error.code)) {
      throw new AccessError("Counselor database setup is incomplete. The site administrator needs to apply the latest counseling migration.", 503);
    }
    throw new AccessError("Counselors are temporarily unavailable.", 503);
  }
  return (data || []).map((row) => mapCounselor(row));
}

export async function createCounselor(input: CounselorInput): Promise<Counselor> {
  const { data, error } = await createAdminSupabaseClient().from("counselors")
    .insert({ id: randomUUID(), ...counselorPayload(input) }).select("*").single();
  if (error || !data) throw new AccessError("Counselor could not be saved.", 503);
  return mapCounselor(data);
}

export async function updateCounselor(id: string, updates: Partial<Counselor>): Promise<Counselor | null> {
  const admin = createAdminSupabaseClient();
  const { data: existing, error: readError } = await admin.from("counselors").select("*").eq("id", id).maybeSingle();
  if (readError) throw new AccessError("Counselor could not be loaded.", 503);
  if (!existing) return null;
  const { data, error } = await admin.from("counselors")
    .update(counselorPayload({ ...mapCounselor(existing), ...updates })).eq("id", id).select("*").single();
  if (error || !data) throw new AccessError("Counselor changes could not be saved.", 503);
  return mapCounselor(data);
}

export async function deleteCounselor(id: string): Promise<boolean> {
  const { data, error } = await createAdminSupabaseClient().from("counselors").delete().eq("id", id).select("id");
  if (error) throw new AccessError("Counselor could not be deleted. Existing consultations may still reference this counselor.", 409);
  return Boolean(data?.length);
}

interface MessageRow { id: string; session_id: string; sender_role: CounselingMessage["senderRole"]; content: string; created_at: string }
function mapMessage(row: MessageRow): CounselingMessage {
  return { id: row.id, sessionId: row.session_id, senderRole: row.sender_role, content: row.content, createdAt: row.created_at };
}

export async function getCounselingMessages(sessionId: string): Promise<CounselingMessage[]> {
  const { data, error } = await createAdminSupabaseClient().from("counseling_messages")
    .select("id,session_id,sender_role,content,created_at").eq("session_id", sessionId)
    .order("created_at").order("id");
  if (error) throw new AccessError("Messages could not be loaded.", 503);
  return (data || []).map(mapMessage);
}

export async function createOrGetCounselingSession(params: {
  clientId: string; counselorId: string; voucherId?: string | null;
  primaryConcern?: string; intakeMood?: string; clientPhone?: string;
}): Promise<CounselingSession> {
  const admin = createAdminSupabaseClient();
  // Ownership, quota consumption, and retry deduplication are one database transaction.
  const { data: session, error } = await admin.rpc("start_counseling_session", {
    p_client_id: params.clientId, p_counselor_id: params.counselorId, p_voucher_id: params.voucherId,
    p_primary_concern: params.primaryConcern || "Emotional support", p_intake_mood: params.intakeMood || "neutral",
  });
  if (error || !session) {
    if (error?.code === "P0001") throw new AccessError("This Care Pass has no sessions available, or the counselor is unavailable.", 409);
    throw new AccessError("Consultation could not be saved. Please try again.", 503);
  }
  const { data: counselor, error: counselorError } = await admin.from("counselors").select("*").eq("id", session.counselor_id).single();
  if (counselorError || !counselor) throw new AccessError("Counselor could not be loaded.", 503);
  return { id: session.id, clientId: session.client_id, counselorId: session.counselor_id,
    counselor: mapCounselor(counselor), voucherId: session.voucher_id, status: session.status,
    primaryConcern: session.primary_concern, intakeMood: session.intake_mood, createdAt: session.created_at,
    messages: await getCounselingMessages(session.id) };
}

export async function sendCounselingMessage(params: {
  sessionId: string; senderRole: "client" | "counselor"; content: string;
}): Promise<CounselingMessage> {
  const { data, error } = await createAdminSupabaseClient().from("counseling_messages")
    .insert({ session_id: params.sessionId, sender_role: params.senderRole, content: params.content })
    .select("id,session_id,sender_role,content,created_at").single();
  if (error || !data) throw new AccessError("Message could not be saved.", 503);
  return mapMessage(data);
}
