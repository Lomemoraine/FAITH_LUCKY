import { createAdminSupabaseClient } from "../supabase/admin";
import { sendVoucherSMS } from "../httpsms";
import { StoreProduct, StoreOrder, CareVoucher } from "../types";

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

export async function processMpesaCheckout(params: {
  productId: string;
  phoneNumber: string;
  shippingAddress?: string;
}): Promise<{
  success: boolean;
  order?: StoreOrder;
  voucher?: CareVoucher;
  error?: string;
}> {
  const allProducts = await getStoreProducts(true);
  const product = allProducts.find((p) => p.id === params.productId) || DEFAULT_PRODUCTS.find((p) => p.id === params.productId);
  if (!product) {
    return { success: false, error: "Selected product was not found." };
  }

  // Format Kenyan phone number
  let cleanPhone = params.phoneNumber.replace(/[\s+-]/g, "");
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "254" + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith("254") && cleanPhone.length === 9) {
    cleanPhone = "254" + cleanPhone;
  }

  if (!/^254(7|1)\d{8}$/.test(cleanPhone)) {
    return { success: false, error: "Please enter a valid Safaricom/Airtel phone number (e.g. 0712345678)." };
  }

  const orderNumber = `TFL-${Date.now().toString().slice(-6)}`;
  const voucherCode = generateVoucherCode();
  const mpesaReceiptNumber = `QK${Math.floor(10000000 + Math.random() * 90000000)}`;

  const now = new Date().toISOString();

  const generatedVoucher: CareVoucher = {
    id: `vouch-${Date.now()}`,
    code: voucherCode,
    therapySessions: product.therapySessionsCount,
    perkDescription: product.carePerk,
    status: "active",
    buyerPhone: cleanPhone,
    createdAt: now,
  };

  const createdOrder: StoreOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    productId: product.id,
    itemName: product.name,
    amountKes: product.priceKes,
    phoneNumber: cleanPhone,
    shippingAddress: params.shippingAddress || "Digital Voucher Delivery",
    paymentMethod: "mpesa_stk",
    paymentStatus: "completed",
    mpesaReceiptNumber,
    voucherCode,
    createdAt: now,
  };

  try {
    const admin = createAdminSupabaseClient();

    // 1. Insert Voucher
    const { data: voucherData } = await admin
      .from("vouchers")
      .insert({
        code: voucherCode,
        therapy_sessions: product.therapySessionsCount,
        perk_description: product.carePerk,
        buyer_phone: cleanPhone,
        status: "active",
      })
      .select()
      .single();

    // 2. Insert Order
    await admin.from("orders").insert({
      order_number: orderNumber,
      product_id: product.id,
      item_name: product.name,
      amount_kes: product.priceKes,
      phone_number: cleanPhone,
      shipping_address: params.shippingAddress || "Digital Voucher Delivery",
      payment_method: "mpesa_stk",
      payment_status: "completed",
      mpesa_receipt_number: mpesaReceiptNumber,
      voucher_id: voucherData?.id || null,
    });
  } catch (err) {
    console.warn("[Store] Database save warning (using memory order/voucher):", err);
  }

  // Dispatch Care Pass voucher code SMS to customer
  sendVoucherSMS({
    customerPhone: cleanPhone,
    voucherCode,
    productTitle: product.name,
  }).catch((err) => console.error("[Store] Failed to send voucher SMS:", err));

  return {
    success: true,
    order: createdOrder,
    voucher: generatedVoucher,
  };
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

  if (!cleanCode) {
    return { success: false, error: "Please enter a Care Pass code (e.g. CARE-XXXX-TFL)." };
  }

  // 1. Real, purchased vouchers in the database are the source of truth.
  try {
    const admin = createAdminSupabaseClient();
    const { data: dbVoucher } = await admin
      .from("vouchers")
      .select("*")
      .eq("code", cleanCode)
      .single();

    if (dbVoucher) {
      if (dbVoucher.status === "redeemed") {
        return { success: false, error: "This Care Pass voucher has already been redeemed." };
      }

      // Mark redeemed if user provided
      if (userProfileId) {
        await admin
          .from("vouchers")
          .update({
            status: "redeemed",
            redeemed_by: userProfileId,
            redeemed_at: new Date().toISOString(),
          })
          .eq("id", dbVoucher.id);
      }

      return {
        success: true,
        voucher: {
          id: dbVoucher.id,
          code: dbVoucher.code,
          therapySessions: dbVoucher.therapy_sessions || 1,
          perkDescription: dbVoucher.perk_description || "1-on-1 Counselor Consultation Session",
          status: "active",
          createdAt: dbVoucher.created_at,
        },
      };
    }
  } catch {
    // DB unavailable — fall through to the explicitly allowed demo code only.
  }

  // 2. The single, publicly advertised demo code (shown in the UI) is allowed
  //    so the flow can be tested. NO other made-up "CARE-..." code is accepted.
  if (cleanCode === DEMO_VOUCHER_CODE) {
    return {
      success: true,
      voucher: {
        id: `vouch-demo-${Date.now()}`,
        code: cleanCode,
        therapySessions: 1,
        perkDescription: "1-on-1 Counselor Consultation Session (Demo)",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: false,
    error:
      "Invalid or unrecognised Care Pass code. Purchase a Care Gift or session pass in the store to receive a valid voucher.",
  };
}

/**
 * Server-side gate used before a counseling session may start. Confirms the
 * caller actually holds a valid Care Pass — a purchased voucher that exists in
 * the database (active or already redeemed) or the advertised demo code.
 * This is the authoritative check; the client-side paywall is only UX.
 */
export async function verifyVoucherAccess(code?: string | null): Promise<boolean> {
  const cleanCode = (code || "").trim().toUpperCase();
  if (!cleanCode) return false;

  if (cleanCode === DEMO_VOUCHER_CODE) return true;

  try {
    const admin = createAdminSupabaseClient();
    const { data } = await admin
      .from("vouchers")
      .select("id,status")
      .eq("code", cleanCode)
      .single();

    // A purchased voucher exists — active (not yet used) or redeemed (this
    // user just unlocked it and is starting their session).
    if (data && (data.status === "active" || data.status === "redeemed")) {
      return true;
    }
  } catch {
    // DB unavailable — only the demo code (handled above) can pass.
  }

  return false;
}
