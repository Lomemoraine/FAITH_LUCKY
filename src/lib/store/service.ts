import { createAdminSupabaseClient } from "../supabase/admin";
import { StoreProduct, CareVoucher } from "../types";

// The only non-purchased code accepted anywhere. Advertised in the UI for demos.
export const DEMO_VOUCHER_CODE = "CARE-DEMO-TFL";

export const DEFAULT_PRODUCTS: StoreProduct[] = [
  {
    id: "hoodie-rose",
    name: "TFL Signature Hope Hoodie",
    description: "Ultra-soft fleece hoodie with discreet embroidered mental health affirmation. Premium warmth, oversized relaxed fit, and durable comfort.",
    priceKes: 2800,
    carePerk: "Unlocks 2 Private 1-on-1 Counseling Sessions",
    therapySessionsCount: 2,
    category: "apparel",
    inStock: true,
  },
  {
    id: "journal-healing",
    name: "Daily Guided Healing & Gratitude Journal",
    description: "180-day guided daily prompts designed by psychologists for emotional check-ins, anxiety tracking, and mindful grounding.",
    priceKes: 1200,
    carePerk: "Unlocks 1 Private 1-on-1 Counseling Session",
    therapySessionsCount: 1,
    category: "stationery",
    inStock: true,
  },
  {
    id: "tee-affirmation",
    name: "“You Are Heard” Affirmation T-Shirt",
    description: "100% breathable organic cotton tee featuring minimalist SafeSpace typography. Soft, pre-shrunk, everyday wear.",
    priceKes: 1500,
    carePerk: "Unlocks 1 Private 1-on-1 Counseling Session",
    therapySessionsCount: 1,
    category: "apparel",
    inStock: true,
  },
  {
    id: "bracelet-serenity",
    name: "TFL Serenity Hope Band",
    description: "Matte black and rose-gold engraved band reminding you to breathe and take each moment one breath at a time.",
    priceKes: 650,
    carePerk: "Unlocks 1 Guided Audio Session & Care Pass",
    therapySessionsCount: 1,
    category: "accessories",
    inStock: true,
  },
  {
    id: "tote-safespace",
    name: "SafeSpace Canvas Affirmation Tote",
    description: "Heavy-duty eco-friendly canvas bag designed for books, market runs, or everyday essentials.",
    priceKes: 950,
    carePerk: "Unlocks 1 Guided Audio Session & Care Pass",
    therapySessionsCount: 1,
    category: "accessories",
    inStock: true,
  },
  {
    id: "direct-therapy-pass",
    name: "Direct 1-on-1 Counseling Session (No Merch)",
    description: "Subsidized 45-minute private tele-counseling session with a licensed Kenyan psychologist. No physical merchandise.",
    priceKes: 500,
    carePerk: "Immediate 1-on-1 Therapist Access",
    therapySessionsCount: 1,
    category: "service",
    inStock: true,
  },
];

// In-memory product store for local fallback/synchronization
let inMemoryProducts: StoreProduct[] = [...DEFAULT_PRODUCTS];

export function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CARE-${randomStr}-TFL`;
}

export async function getStoreProducts(includeInactive: boolean = false): Promise<StoreProduct[]> {
  try {
    const admin = createAdminSupabaseClient();
    let query = admin.from("products").select("*").order("price_kes", { ascending: true });
    
    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return includeInactive
        ? inMemoryProducts
        : inMemoryProducts.filter((p) => p.inStock !== false);
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceKes: p.price_kes,
      carePerk: p.care_perk,
      therapySessionsCount: p.therapy_sessions_count || 1,
      category: p.category || "accessories",
      imageUrl: p.image_url,
      inStock: p.is_active,
    }));
  } catch {
    return includeInactive
      ? inMemoryProducts
      : inMemoryProducts.filter((p) => p.inStock !== false);
  }
}

export async function createStoreProduct(input: {
  name: string;
  description: string;
  priceKes: number;
  carePerk?: string;
  therapySessionsCount?: number;
  category?: "apparel" | "stationery" | "accessories" | "service";
  imageUrl?: string;
  inStock?: boolean;
}): Promise<StoreProduct> {
  const id = `gift-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const carePerk = input.carePerk || `Unlocks ${input.therapySessionsCount || 1} Private 1-on-1 Counseling Session`;

  const newProduct: StoreProduct = {
    id,
    name: input.name.trim(),
    description: input.description.trim(),
    priceKes: Number(input.priceKes) || 0,
    carePerk,
    therapySessionsCount: Number(input.therapySessionsCount) || 1,
    category: input.category || "accessories",
    imageUrl: input.imageUrl?.trim() || undefined,
    inStock: input.inStock !== false,
  };

  // Add to in-memory store
  inMemoryProducts = [newProduct, ...inMemoryProducts];

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("products").insert({
      id: newProduct.id,
      name: newProduct.name,
      description: newProduct.description,
      price_kes: newProduct.priceKes,
      care_perk: newProduct.carePerk,
      therapy_sessions_count: newProduct.therapySessionsCount,
      category: newProduct.category,
      image_url: newProduct.imageUrl || null,
      is_active: newProduct.inStock,
    });
  } catch (err) {
    console.warn("[Store] Database save product warning (stored in-memory):", err);
  }

  return newProduct;
}

export async function updateStoreProduct(
  id: string,
  updates: Partial<StoreProduct>
): Promise<StoreProduct | null> {
  const existingIdx = inMemoryProducts.findIndex((p) => p.id === id);
  if (existingIdx !== -1) {
    inMemoryProducts[existingIdx] = {
      ...inMemoryProducts[existingIdx],
      ...updates,
    };
  }

  try {
    const admin = createAdminSupabaseClient();
    const dbPayload: Record<string, unknown> = {};
    if (updates.name !== undefined) dbPayload.name = updates.name;
    if (updates.description !== undefined) dbPayload.description = updates.description;
    if (updates.priceKes !== undefined) dbPayload.price_kes = updates.priceKes;
    if (updates.carePerk !== undefined) dbPayload.care_perk = updates.carePerk;
    if (updates.therapySessionsCount !== undefined) dbPayload.therapy_sessions_count = updates.therapySessionsCount;
    if (updates.category !== undefined) dbPayload.category = updates.category;
    if (updates.imageUrl !== undefined) dbPayload.image_url = updates.imageUrl;
    if (updates.inStock !== undefined) dbPayload.is_active = updates.inStock;

    if (Object.keys(dbPayload).length > 0) {
      await admin.from("products").update(dbPayload).eq("id", id);
    }
  } catch (err) {
    console.warn("[Store] Database update product warning:", err);
  }

  const all = await getStoreProducts(true);
  return all.find((p) => p.id === id) || (existingIdx !== -1 ? inMemoryProducts[existingIdx] : null);
}

export async function deleteStoreProduct(id: string): Promise<boolean> {
  inMemoryProducts = inMemoryProducts.filter((p) => p.id !== id);

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("products").delete().eq("id", id);
    return true;
  } catch (err) {
    console.warn("[Store] Database delete product warning:", err);
    return true;
  }
}

export async function validateAndRedeemVoucher(
  code: string,
  userProfileId?: string
): Promise<{
  success: boolean;
  voucher?: CareVoucher;
  error?: string;
}> {
  const cleanCode = code.trim().toUpperCase();

  if (!userProfileId || cleanCode === DEMO_VOUCHER_CODE) {
    return { success: false, error: "An authenticated profile and purchased Care Pass are required." };
  }
  if (!cleanCode) {
    return { success: false, error: "Please enter a Care Pass code (e.g. CARE-XXXX-TFL)." };
  }

  // 1. Real, purchased vouchers in the database are the source of truth.
  try {
    const admin = createAdminSupabaseClient();
    // Conditional update is atomic: a second user cannot claim this voucher.
    const { data: purchase, error: purchaseError } = await admin.from("orders")
      .select("id,vouchers!inner(code)").eq("vouchers.code", cleanCode)
      .eq("payment_status", "completed").not("payment_verified_at", "is", null).maybeSingle();
    if (purchaseError || !purchase) return { success: false, error: "This Care Pass does not have a verified payment." };
    const { error: claimError } = await admin.from("vouchers")
      .update({ status: "redeemed", redeemed_by: userProfileId, redeemed_at: new Date().toISOString() })
      .eq("code", cleanCode).eq("status", "active").is("redeemed_by", null);
    if (claimError) throw claimError;
    const { data: dbVoucher, error } = await admin
      .from("vouchers")
      .select("*")
      .eq("code", cleanCode)
      .single();
    if (error) throw error;

    if (dbVoucher) {
      if (dbVoucher.status !== "redeemed" || dbVoucher.redeemed_by !== userProfileId) {
        return { success: false, error: "This Care Pass is expired or belongs to another profile." };
      }

      return {
        success: true,
        voucher: {
          id: dbVoucher.id,
          code: dbVoucher.code,
          therapySessions: dbVoucher.therapy_sessions || 1,
          perkDescription: dbVoucher.perk_description || "1-on-1 Counselor Consultation Session",
          status: "redeemed",
          createdAt: dbVoucher.created_at,
        },
      };
    }
  } catch {
    return { success: false, error: "Unable to verify this Care Pass. Check the code and try again." };
  }

  return {
    success: false,
    error:
      "Invalid or unrecognised Care Pass code. Purchase a Care Gift or session pass in the store to receive a valid voucher.",
  };
}

/**
 * Server-side gate used before a counseling session may start. Confirms the
 * caller owns the redeemed Care Pass in the database.
 * This is the authoritative check; the client-side paywall is only UX.
 */
export async function verifyVoucherAccess(code?: string | null, userProfileId?: string): Promise<boolean> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode || !userProfileId || cleanCode === DEMO_VOUCHER_CODE) return false;


  try {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from("vouchers")
      .select("id,status,redeemed_by")
      .eq("code", cleanCode)
      .single();

    // A purchased voucher exists — active (not yet used) or redeemed (this
    // user just unlocked it and is starting their session).
    if (data && data.status === "redeemed" && data.redeemed_by === userProfileId) {
      const { data: purchase, error } = await admin.from("orders").select("id").eq("voucher_id", data.id)
        .eq("payment_status", "completed").not("payment_verified_at", "is", null).maybeSingle();
      return !error && !!purchase;
    }
  } catch {
    // DB unavailable — only the demo code (handled above) can pass.
  }

  return false;
}
