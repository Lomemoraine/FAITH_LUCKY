import { ModerationSeverity } from "../types";

export interface AISafetyEvaluation {
  triggered: boolean;
  severity: ModerationSeverity | null;
  reason?: string;
  detectedLanguage?: string;
  modelUsed?: string;
}

const SYSTEM_PROMPT = `You are an expert clinical triage safety assistant for TFL SafeSpace, an anonymous youth mental health platform in Kenya.
Your role is to classify community messages for immediate self-harm, suicidal ideation, or acute crisis risk.
Users may write in English, Swahili, Kenyan Sheng, or a mix of these.

Classification Categories:
1. "critical":
   - Explicit or indirect suicide intent (e.g. "nataka kujiua", "I am going to sleep forever tonight", "goodbye everyone I can't take this pain", "giving away all my stuff and ending it", "heri nidedi kuliko hii").
   - Severe immediate self-harm or lethal planning.

2. "priority":
   - Severe emotional distress, deep hopelessness, feeling worthless or like a burden without explicit immediate lethal plans (e.g. "maisha haina maana nimechoka", "hurting myself just to feel", "nobody cares if I exist", "I wish I never woke up").

3. "safe":
   - Everyday emotional venting, sadness, job/relationship stress, grief processing, anxiety questions, or encouraging supportive messages (e.g. "I had a bad breakup today", "stressed about exams", "feeling down but trying to meditate", "stay strong brother").

OUTPUT FORMAT:
Respond ONLY with a valid JSON object in this exact schema (no markdown fences, no extra text):
{
  "isCrisis": boolean,
  "severity": "critical" | "priority" | null,
  "reason": "brief 1-sentence explanation of why it was flagged or why it is safe",
  "detectedLanguage": "english" | "swahili" | "sheng" | "mixed"
}`;

/**
 * Classifies text using OpenRouter (default: google/gemini-3-flash-preview) or Direct Gemini API.
 * Falls back safely if API keys are not configured or network request times out.
 */
export async function classifyContentWithAI(content: string): Promise<AISafetyEvaluation> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiDirectKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!openRouterKey && !geminiDirectKey) {
    // Fail open gracefully to regex fallback
    return { triggered: false, severity: null };
  }

  // 1. Preferred Route: OpenRouter with Gemini 3 Flash / 2 Flash Preview
  if (openRouterKey) {
    const model = process.env.OPENROUTER_MODEL || "google/gemini-3-flash-preview";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safespace.talkfreelylifestyle.org";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s max

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": siteUrl,
          "X-Title": "TFL SafeSpace Crisis Triage",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Message to evaluate:\n"${content}"` },
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[AISafety/OpenRouter] Error HTTP ${response.status}:`, errText);
        return { triggered: false, severity: null };
      }

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content?.trim();

      if (!rawText) {
        return { triggered: false, severity: null };
      }

      // Strip potential markdown fences if present
      const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleanJson) as {
        isCrisis: boolean;
        severity: "critical" | "priority" | null;
        reason?: string;
        detectedLanguage?: string;
      };

      return {
        triggered: Boolean(parsed.isCrisis && parsed.severity),
        severity: parsed.severity || null,
        reason: parsed.reason,
        detectedLanguage: parsed.detectedLanguage,
        modelUsed: `OpenRouter (${model})`,
      };
    } catch (error) {
      console.warn("[AISafety/OpenRouter] Error (falling back):", error instanceof Error ? error.message : error);
      return { triggered: false, severity: null };
    }
  }

  // 2. Secondary Direct Gemini API Route
  if (geminiDirectKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiDirectKey}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${SYSTEM_PROMPT}\n\nMessage to evaluate:\n"${content}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150,
            responseMimeType: "application/json",
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) return { triggered: false, severity: null };

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!candidateText) return { triggered: false, severity: null };

      const parsed = JSON.parse(candidateText) as {
        isCrisis: boolean;
        severity: "critical" | "priority" | null;
        reason?: string;
        detectedLanguage?: string;
      };

      return {
        triggered: Boolean(parsed.isCrisis && parsed.severity),
        severity: parsed.severity || null,
        reason: parsed.reason,
        detectedLanguage: parsed.detectedLanguage,
        modelUsed: "Direct Gemini 1.5 Flash",
      };
    } catch {
      return { triggered: false, severity: null };
    }
  }

  return { triggered: false, severity: null };
}
