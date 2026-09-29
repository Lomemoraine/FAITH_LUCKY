import { KenyaCrisisResource, ModerationSeverity } from "../types";
import { classifyContentWithAI } from "./ai-classifier";

export const KENYA_CRISIS_RESOURCES: KenyaCrisisResource[] = [
  {
    name: "Befrienders Kenya (Suicide Prevention Helpline)",
    phone: "+254722178177",
    displayPhone: "0722 178 177 / 0736 542 304",
    description: "Free, confidential emotional support for anyone experiencing distress, depression, or suicidal feelings.",
    availableHours: "24/7 Helpline",
    tollFree: false,
  },
  {
    name: "Niskize 24-Hour Crisis Line",
    phone: "0900620800",
    displayPhone: "0900 620 800",
    description: "Trained telephone counselors providing immediate crisis intervention and mental health navigation in Kenya.",
    availableHours: "24/7 Toll Free",
    tollFree: true,
  },
  {
    name: "Kenya Red Cross Toll-Free Support",
    phone: "1199",
    displayPhone: "1199",
    description: "Psychological first aid, disaster mental health support, and emergency response dispatch across Kenya.",
    availableHours: "24/7 Toll Free",
    tollFree: true,
  },
  {
    name: "LVCT Health Youth Crisis Line",
    phone: "1190",
    displayPhone: "1190 / 0800 720 121",
    description: "Gender-based violence, youth crisis intervention, trauma, and reproductive health counseling.",
    availableHours: "24/7 Toll Free",
    tollFree: true,
  },
  {
    name: "Childline Kenya (Youth & Adolescents)",
    phone: "116",
    displayPhone: "116",
    description: "National helpline for young people facing abuse, neglect, emotional trauma, or self-harm concerns.",
    availableHours: "24/7 Toll Free",
    tollFree: true,
  },
];

// Critical phrases that indicate immediate risk of harm
const CRITICAL_PATTERNS: RegExp[] = [
  /\b(kill\s+myself|end\s+my\s+life|commit\s+suicide|want\s+to\s+die|hang\s+myself|take\s+all\s+my\s+pills)\b/i,
  /\b(nataka\s+kujiua|kujiua|kumaliza\s+maisha|sitaki\s+kuishi)\b/i, // Sheng/Swahili
  /\b(goodbye\s+everyone|goodbye\s+cruel\s+world|this\s+is\s+my\s+suicide\s+note)\b/i,
  /\b(slit\s+my\s+wrists|cut\s+myself\s+deep|overdose\s+on)\b/i,
];

// Priority phrases indicating severe distress, self-harm thoughts, or crisis
const PRIORITY_PATTERNS: RegExp[] = [
  /\b(can't\s+go\s+on\s+anymore|cant\s+go\s+on\s+anymore|no\s+reason\s+to\s+live|better\s+off\s+dead|wish\s+i\s+never\s+woke\s+up)\b/i,
  /\b(hurting\s+myself|self\s*harm|burn\s+myself|hate\s+being\s+alive)\b/i,
  /\b(nimechoka\s+na\s+haya\s+maisha|maisha\s+haina\s+maana|heri\s+nife)\b/i,
];

export interface SafetyCheckResult {
  triggered: boolean;
  severity: ModerationSeverity | null;
  matchedPattern?: string;
  isAiFlagged?: boolean;
}

/**
 * Tier 1: Synchronous rule-based pattern scanner (Instant 0ms latency)
 */
export function evaluateSafetyPolicy(content: string): SafetyCheckResult {
  const normalized = content.trim();

  for (const pattern of CRITICAL_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        triggered: true,
        severity: "critical",
        matchedPattern: pattern.source,
        isAiFlagged: false,
      };
    }
  }

  for (const pattern of PRIORITY_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        triggered: true,
        severity: "priority",
        matchedPattern: pattern.source,
        isAiFlagged: false,
      };
    }
  }

  return {
    triggered: false,
    severity: null,
  };
}

/**
 * Tier 2: Hybrid Safety Engine combining fast Pattern Scanner + AI Semantic Intent Analysis
 * Catches unlisted phrasing, Sheng metaphors, coded cries for help, and indirect suicidal ideation.
 */
export async function evaluateSafetyPolicyAsync(content: string): Promise<SafetyCheckResult> {
  // Step 1: Run fast regex
  const regexCheck = evaluateSafetyPolicy(content);
  if (regexCheck.triggered && regexCheck.severity === "critical") {
    // If already confirmed critical, return immediately
    return regexCheck;
  }

  // Step 2: Run AI semantic classification (Sheng / Swahili / English)
  try {
    const aiResult = await classifyContentWithAI(content);
    if (aiResult.triggered && aiResult.severity) {
      return {
        triggered: true,
        severity: aiResult.severity,
        matchedPattern: aiResult.reason || "AI Semantic Crisis Detection",
        isAiFlagged: true,
      };
    }
  } catch (err) {
    console.warn("[SafetyPolicy] AI triage fallback to regex:", err);
  }

  return regexCheck;
}

