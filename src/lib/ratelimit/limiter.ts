import crypto from "crypto";
import { createAdminSupabaseClient } from "../supabase/admin";

export type RateLimitAction = "create_post" | "create_reply" | "create_report" | "toggle_reaction" | "create_account";

interface RateLimitConfig {
  maxCount: number;
  windowSeconds: number;
}

const RATE_LIMIT_CONFIGS: Record<RateLimitAction, RateLimitConfig> = {
  create_post: { maxCount: 3, windowSeconds: 3600 },
  create_reply: { maxCount: 10, windowSeconds: 3600 },
  create_report: { maxCount: 5, windowSeconds: 86400 },
  toggle_reaction: { maxCount: 60, windowSeconds: 3600 },
  create_account: { maxCount: 5, windowSeconds: 86400 },
};

export function hashSubject(subject: string): string {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET || "default_local_dev_hmac_secret";
  return crypto.createHmac("sha256", secret).update(subject).digest("hex");
}

export async function checkRateLimit(
  subject: string,
  action: RateLimitAction
): Promise<{ allowed: boolean; retryAfterSeconds?: number; message?: string }> {
  const config = RATE_LIMIT_CONFIGS[action];
  if (!config) {
    return { allowed: true };
  }

  const subjectHash = hashSubject(subject);
  const now = Date.now();
  const windowDurationMs = config.windowSeconds * 1000;
  // Floor to window boundary
  const windowStartTimestamp = Math.floor(now / windowDurationMs) * windowDurationMs;
  const windowStart = new Date(windowStartTimestamp).toISOString();
  const expiresAt = new Date(windowStartTimestamp + windowDurationMs).toISOString();

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_subject_hash: subjectHash,
      p_action: action,
      p_window_start: windowStart,
      p_expires_at: expiresAt,
      p_max_count: config.maxCount,
    });

    if (error) {
      console.error("[RateLimit] RPC Error:", error.message);
      // Fail open gracefully in development/fallback
      return { allowed: true };
    }

    const res = data as { allowed: boolean; current_count: number; max_count: number; reset_at: string };
    if (!res.allowed) {
      const resetTime = new Date(res.reset_at).getTime();
      const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        message: `You have reached the limit for this action. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error("[RateLimit] Unexpected error:", err);
    return { allowed: true };
  }
}
