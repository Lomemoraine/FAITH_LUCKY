"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { PaymentView } from "@/lib/mpesa/payments";
import NextImage from "next/image";
import { StoreProduct, StoreOrder, CareVoucher } from "@/lib/types";
import {
  ShoppingBag,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ArrowRight,
  RefreshCw,
  Phone,
  Truck,
  Zap,
} from "lucide-react";

interface StoreViewProps {
  onGoToCounselor: (voucherCode?: string) => void;
}

export function StoreView({ onGoToCounselor }: StoreViewProps) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);

  // Checkout State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{
    order: StoreOrder;
    voucher: CareVoucher;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState<string | null>(null);
  const submitting = useRef(false);

  const applyPayment = useCallback((data: PaymentView) => {
    setPayment(data);
    setSelectedProduct((previous) => previous || { id: data.order.productId, name: data.order.itemName,
      description: "", priceKes: data.order.amountKes, carePerk: data.voucher?.perkDescription || "Care Pass",
      therapySessionsCount: data.voucher?.therapySessions || 1, category: "service" });
    if (data.order.paymentStatus === "completed" && data.voucher) setCheckoutSuccess({ order: data.order, voucher: data.voucher });
    if (data.order.paymentStatus === "pending") {
      setPendingOrderId(data.order.id);
      try { localStorage.setItem("tfl-payment-order-v1", data.order.id); } catch { /* Storage may be unavailable. */ }
    } else {
      setPendingOrderId(null);
      setAttemptKey(null);
      try { localStorage.removeItem("tfl-payment-order-v1"); localStorage.removeItem("tfl-payment-attempt-v1"); } catch { /* Keep current state. */ }
    }
  }, []);

  useEffect(() => {
    try {
      const key = localStorage.getItem("tfl-payment-attempt-v1");
      const orderId = localStorage.getItem("tfl-payment-order-v1");
      setAttemptKey(key);
      if (orderId) setPendingOrderId(orderId);
      else if (key) {
        fetch(`/api/store/orders?attempt=${encodeURIComponent(key)}`, { cache: "no-store" })
          .then(async (response) => { if (response.ok) applyPayment(await response.json()); })
          .catch(() => setCheckoutError("Unable to recover your previous checkout. Retry with the same details before starting another payment."));
      }
    } catch { /* Checkout still works without local storage; keep the order number. */ }
  }, [applyPayment]);

  useEffect(() => {
    if (!pendingOrderId) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch(`/api/store/orders/${pendingOrderId}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || "Unable to check payment.");
        if (!controller.signal.aborted) { applyPayment(data); setCheckoutError(null); }
      } catch {
        if (!controller.signal.aborted) setCheckoutError("Payment status is temporarily unavailable. Keep this order number; do not pay again while confirmation is pending.");
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(poll, 15000);
      }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [pendingOrderId, applyPayment]);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/store/products");
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMpesaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || submitting.current || pendingOrderId) return;

    submitting.current = true;
    setIsProcessingCheckout(true);
    setCheckoutError(null);

    try {
      const auth = await fetch("/api/auth/anonymous", { method: "POST" });
      const profile = await auth.json();
      if (!auth.ok || !profile.success) { setCheckoutError(profile.error || "Unable to start your anonymous session."); return; }
      const key = attemptKey || crypto.randomUUID();
      setAttemptKey(key);
      try { localStorage.setItem("tfl-payment-attempt-v1", key); } catch { /* Retain key in memory. */ }
      const res = await fetch("/api/store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          idempotencyKey: key,
          phoneNumber,
          shippingAddress: selectedProduct.category === "service" ? "Digital Session" : shippingAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckoutError(data.error || "Failed to process M-Pesa STK checkout. Please check your phone number.");
      } else {
        applyPayment(data);
      }
    } catch {
      setCheckoutError("Connection error while connecting to M-Pesa gateway.");
    } finally {
      submitting.current = false;
      setIsProcessingCheckout(false);
    }
  }

  function handleCopyVoucher(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  }

  function resetCheckoutModal() {
    if (submitting.current) return;
    setCheckoutOpen(false);
  }

  const categoryIcons: Record<string, string> = {
    apparel: "👕",
    stationery: "📖",
    accessories: "✨",
    service: "🩺",
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {payment && !checkoutOpen && (
        <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-2">
          <p>{payment.message}</p>
          <p className="text-xs break-all">Order: {payment.order.orderNumber}</p>
          <button onClick={() => setCheckoutOpen(true)} className="font-semibold underline">View order</button>
        </div>
      )}
      {checkoutError && !checkoutOpen && <p role="alert" className="text-sm text-red-700">{checkoutError}</p>}
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              “Merch-to-Care” Impact Model
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Wear Hope. Sponsor Healing.
            </h1>
            <p className="text-rose-100 text-sm sm:text-base leading-relaxed">
              Every TFL hoodie, journal, and wristband unlocks a <strong className="text-white">SafeSpace Care Pass</strong> for private 1-on-1 sessions with licensed psychologists.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Instant M-Pesa STK Push Prompts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Automated Care Pass Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>100% Subsidized Youth Therapy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              TFL Care Gifts & Merch Catalog
            </h2>
            <p className="text-xs text-slate-500">Select an item to sponsor or unlock your counseling pass</p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-400" />
            <p className="text-sm">Loading TFL Care catalog...</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const isDirectService = product.category === "service";

              return (
                <div
                  key={product.id}
                  className={`group flex flex-col justify-between overflow-hidden rounded-3xl bg-white border transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
                    isDirectService
                      ? "border-emerald-200 ring-2 ring-emerald-400/20"
                      : "border-rose-100 hover:border-rose-300"
                  }`}
                >
                  {/* Large ecommerce-style product image hero */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
                    {product.imageUrl ? (
                      <NextImage
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      /* Attractive fallback so cards still look like a storefront */
                      <div
                        className={`flex h-full w-full items-center justify-center ${
                          isDirectService
                            ? "bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-100"
                            : "bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100"
                        }`}
                      >
                        <span className="text-6xl drop-shadow-sm transition-transform duration-500 group-hover:scale-110">
                          {categoryIcons[product.category] || "🎁"}
                        </span>
                      </div>
                    )}

                    {/* Category badge overlaid on image */}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                        isDirectService
                          ? "bg-emerald-600/90 text-white"
                          : "bg-white/90 text-rose-700"
                      }`}
                    >
                      {isDirectService ? "⚡ Direct Session" : "Merchandise"}
                    </span>

                    {/* Price tag overlaid on image (ecommerce style) */}
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1.5 text-sm font-extrabold text-slate-900 shadow-md backdrop-blur-sm">
                      KES {product.priceKes.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-snug">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      {/* Care Pass Perk Badge */}
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] font-semibold text-amber-900">
                        <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{product.carePerk}</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => {
                        if (pendingOrderId) { setCheckoutOpen(true); return; }
                        setSelectedProduct(product); setCheckoutSuccess(null); setPayment(null); setCheckoutError(null);
                        setPhoneNumber(""); setShippingAddress(""); setCheckoutOpen(true);
                      }}
                      className={`mt-5 w-full py-3 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                        isDirectService
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      <span>{isDirectService ? "Book Session via M-Pesa" : "Buy via M-Pesa"}</span>
                      <Zap className="w-3.5 h-3.5 fill-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust & Transparency Footnote */}
      <div className="grid gap-4 sm:grid-cols-3 rounded-2xl bg-white p-6 border border-rose-100 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-900">Secure Daraja STK Push</strong>
            Prompt arrives straight to your phone. PIN is never entered on our website.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-900">Nairobi & Countrywide Delivery</strong>
            Same-day voucher issuance, merchandise dispatched within 24-48 hours.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-slate-900">Direct Impact Guarantee</strong>
            100% of voucher-backed sessions are handled by certified Kenyan psychologists.
          </div>
        </div>
      </div>

      {/* M-Pesa Checkout Modal */}
      {checkoutOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            {payment && payment.order.paymentStatus !== "completed" ? (
              <div className="space-y-5" role="status">
                <h3 className="text-xl font-bold">{payment.order.paymentStatus === "pending" ? "Waiting for payment confirmation" : "Payment not completed"}</h3>
                <p>{payment.message}</p>
                <p className="text-sm">KES {payment.order.amountKes.toLocaleString()} — {payment.order.itemName}</p>
                <p className="text-xs break-all">Order: {payment.order.orderNumber}</p>
                {checkoutError && <p role="alert" className="text-red-700 text-sm">{checkoutError}</p>}
                {payment.order.paymentStatus === "pending" && <p className="text-sm text-slate-600">No Care Pass is issued until payment is confirmed. You can close this dialog and return to the same order.</p>}
                {payment.order.paymentStatus === "failed" && <button onClick={() => { setPayment(null); setCheckoutError(null); }} className="font-semibold underline">Try a new payment</button>}
                <button onClick={resetCheckoutModal} className="block rounded-xl border p-3">Close</button>
              </div>
            ) : !checkoutSuccess ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                      M-Pesa STK Push Checkout
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedProduct.name}
                    </h3>
                  </div>
                  <button
                    onClick={resetCheckoutModal}
                    disabled={isProcessingCheckout}
                    className="text-slate-400 hover:text-slate-600 text-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block">Total Payable</span>
                    <strong className="text-base text-rose-700 font-extrabold">
                      KES {selectedProduct.priceKes.toLocaleString()}
                    </strong>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-800 font-semibold text-[11px]">
                    🎁 {selectedProduct.carePerk}
                  </span>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {checkoutError}
                  </div>
                )}

                <form onSubmit={handleMpesaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-rose-500" />
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 0712345678 or 0112345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full text-sm p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-white"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      You will receive an instant STK push popup on this phone to authorize payment.
                    </span>
                  </div>

                  {selectedProduct.category !== "service" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-rose-500" />
                        Delivery Location (City / Area)
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        placeholder="e.g. Westlands, Nairobi or Town Pick-up"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full text-sm p-3.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetCheckoutModal}
                      disabled={isProcessingCheckout}
                      className="w-1/3 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessingCheckout}
                      className="w-2/3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingCheckout ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending STK Prompt...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay KES {selectedProduct.priceKes.toLocaleString()}</span>
                          <Zap className="w-4 h-4 fill-white" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Success / Voucher Delivered Screen */
              <div className="text-center space-y-5 py-2 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Payment Successful{checkoutSuccess.order.mpesaReceiptNumber ? ` • Receipt #${checkoutSuccess.order.mpesaReceiptNumber}` : ""}
                  </span>
                  <h3 className="text-2xl font-display font-bold text-slate-900 mt-1">
                    Your Care Pass Is Ready!
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    Thank you for your order. Your voucher has been generated and is ready to unlock private counselor support.
                  </p>
                </div>

                {/* Voucher Pass Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-dashed border-rose-300 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700">
                      SafeSpace Care Pass
                    </span>
                    <span className="text-[11px] font-bold text-slate-600">
                      {checkoutSuccess.voucher.therapySessions} Session(s) Included
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-200">
                    <span className="font-mono text-base font-extrabold text-slate-900 tracking-wider">
                      {checkoutSuccess.voucher.code}
                    </span>
                    <button
                      onClick={() => handleCopyVoucher(checkoutSuccess.voucher.code)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCode ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Perk: {checkoutSuccess.voucher.perkDescription}
                  </p>
                </div>

                {/* Next Steps Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      const code = checkoutSuccess.voucher.code;
                      resetCheckoutModal();
                      onGoToCounselor(code);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Talk to a Counselor Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={resetCheckoutModal}
                    className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Close & Keep Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
