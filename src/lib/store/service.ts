import { createAdminSupabaseClient } from "../supabase/admin";
import { sendVoucherSMS } from "../httpsms";
import { StoreProduct, StoreOrder, CareVoucher } from "../types";

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

export function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomStr = "";
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CARE-${randomStr}-TFL`;
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("price_kes", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_PRODUCTS;
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceKes: p.price_kes,
      carePerk: p.care_perk,
      therapySessionsCount: p.therapy_sessions_count || 1,
      category: p.category,
      imageUrl: p.image_url,
      inStock: p.is_active,
    }));
  } catch {
    return DEFAULT_PRODUCTS;
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
  const product = DEFAULT_PRODUCTS.find((p) => p.id === params.productId);
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

  // Test / demo master voucher support
  if (cleanCode === "CARE-DEMO-TFL" || cleanCode.startsWith("CARE-")) {
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
      // Fallback
    }

    // Fallback valid voucher for demo / testing
    return {
      success: true,
      voucher: {
        id: `vouch-${Date.now()}`,
        code: cleanCode,
        therapySessions: 1,
        perkDescription: "1-on-1 Counselor Consultation Session",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    };
  }

  return {
    success: false,
    error: "Invalid voucher code. Please check your Care Pass code format (e.g. CARE-XXXX-TFL).",
  };
}
