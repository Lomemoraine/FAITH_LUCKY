"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Trash2,
  UserX,
  CheckCircle,
  Clock,
  RefreshCw,
  Mail,
  Heart,
  Send,
  Stethoscope,
  Lock,
  Plus,
  ShoppingBag,
  UserCheck,
  Edit2,
  KeyRound,
  DollarSign,
  Tag,
  Star,
  Check,
  X,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { VoicePlayer } from "@/app/components/voice-player";
import {
  ModerationCase,
  ModerationActionType,
  StoreProduct,
  Counselor,
} from "@/lib/types";

type AdminTab = "moderation" | "gifts" | "counselors";

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<AdminTab>("moderation");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<"password" | "magic_link">("password");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Moderation State
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [actionReason, setActionReason] = useState<{ [caseId: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [clinicalReplyText, setClinicalReplyText] = useState<{ [caseId: string]: string }>({});
  const [clinicalInviteChat, setClinicalInviteChat] = useState<{ [caseId: string]: boolean }>({});
  const [showClinicalForm, setShowClinicalForm] = useState<{ [caseId: string]: boolean }>({});

  // Gifts / Products State
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    priceKes: 1500,
    carePerk: "Unlocks 1 Private 1-on-1 Counseling Session",
    therapySessionsCount: 1,
    category: "apparel" as "apparel" | "stationery" | "accessories" | "service",
    imageUrl: "",
    inStock: true,
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  async function handleProductImageFile(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError("Image file size cannot exceed 5MB.");
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/store/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.imageUrl) {
        setProductForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        // Fallback to client data URL
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setProductForm((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProductForm((prev) => ({ ...prev, imageUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Counselors State
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoadingCounselors, setIsLoadingCounselors] = useState(false);
  const [showAddCounselorModal, setShowAddCounselorModal] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState<Counselor | null>(null);
  const [counselorForm, setCounselorForm] = useState({
    name: "",
    title: "Licensed Clinical Psychologist",
    specialty: "Anxiety, Panic & Trauma Support",
    bio: "",
    licenseNumber: "",
    isLicensed: true,
    showLicenseNumber: false,
    avatarInitials: "",
    isOnline: true,
    rating: 4.9,
    sessionsCompleted: 100,
  });
  const [isSavingCounselor, setIsSavingCounselor] = useState(false);

  const loadQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch("/api/moderation/queue");
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error("Queue load error", err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetch("/api/store/products?includeInactive=true");
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Products load error", err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const loadCounselors = useCallback(async () => {
    setIsLoadingCounselors(true);
    try {
      const res = await fetch("/api/counseling/counselors");
      const data = await res.json();
      if (data.success && data.counselors) {
        setCounselors(data.counselors);
      }
    } catch (err) {
      console.error("Counselors load error", err);
    } finally {
      setIsLoadingCounselors(false);
    }
  }, []);

  const checkModeratorAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/moderation/auth");
      const data = await res.json();
      if (data.isModerator) {
        setIsAuthenticated(true);
        setUserEmail(data.email || "Staff Admin");
        loadQueue();
        loadProducts();
        loadCounselors();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, [loadQueue, loadProducts, loadCounselors]);

  useEffect(() => {
    checkModeratorAuth();
  }, [checkModeratorAuth]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingAuth(true);

    try {
      const payload =
        authMode === "password"
          ? { password: passwordInput }
          : { email: emailInput };

      const res = await fetch("/api/moderation/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Unable to authenticate with provided credentials.");
      } else if (data.devMode || authMode === "password") {
        setIsAuthenticated(true);
        setUserEmail(data.email || "admin@talkfreelylifestyle.org");
        loadQueue();
        loadProducts();
        loadCounselors();
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setAuthError("Network error while authenticating.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleSignOut() {
    try {
      await fetch("/api/moderation/auth", { method: "DELETE" });
      setIsAuthenticated(false);
      setUserEmail("");
      setMagicLinkSent(false);
    } catch (err) {
      console.error("Sign out error", err);
    }
  }

  // --- Moderation Handlers ---
  async function handleClinicalSubmit(caseId: string) {
    const text = clinicalReplyText[caseId]?.trim();
    if (!text) {
      setActionMessage("Please enter a clinical response message before submitting.");
      return;
    }

    setActionLoading(caseId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/moderation/intervene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          responseText: text,
          invitePrivateChat: clinicalInviteChat[caseId] !== false,
          counselorName: userEmail ? `Counselor (${userEmail.split("@")[0]})` : "Dr. Faith Mwangi (Clinical Psychologist)",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage(data.error || "Failed to post clinical response.");
      } else {
        setCases((prev) => prev.filter((c) => c.id !== caseId));
        setActionMessage("💙 Clinical response and private consultation invite dispatched successfully!");
      }
    } catch {
      setActionMessage("Network error submitting clinical response.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleModerationAction(caseId: string, action: ModerationActionType) {
    const reason = actionReason[caseId]?.trim() || `Moderator performed ${action}`;
    setActionLoading(caseId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/moderation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage(data.error || "Action failed.");
      } else {
        setCases((prev) => prev.filter((c) => c.id !== caseId));
        setActionMessage(`Action '${action}' applied successfully.`);
      }
    } catch {
      setActionMessage("Network error performing action.");
    } finally {
      setActionLoading(null);
    }
  }

  // --- Gifts / Products Handlers ---
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        // Edit existing
        const res = await fetch("/api/store/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            ...productForm,
          }),
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? data.product : p))
          );
          setShowAddProductModal(false);
          setEditingProduct(null);
          setActionMessage("🎁 Gift product updated successfully!");
        } else {
          setActionMessage(data.error || "Failed to update product.");
        }
      } else {
        // Create new
        const res = await fetch("/api/store/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productForm),
        });
        const data = await res.json();
        if (data.success && data.product) {
          setProducts((prev) => [data.product, ...prev]);
          setShowAddProductModal(false);
          setActionMessage("🎁 New gift product added to store!");
        } else {
          setActionMessage(data.error || "Failed to create product.");
        }
      }
    } catch {
      setActionMessage("Network error while saving product.");
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure you want to remove this gift product?")) return;
    try {
      const res = await fetch(`/api/store/products?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setActionMessage("Product removed from catalog.");
      }
    } catch {
      setActionMessage("Network error while deleting product.");
    }
  }

  function openEditProduct(p: StoreProduct) {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description,
      priceKes: p.priceKes,
      carePerk: p.carePerk,
      therapySessionsCount: p.therapySessionsCount || 1,
      category: p.category || "apparel",
      imageUrl: p.imageUrl || "",
      inStock: p.inStock !== false,
    });
    setShowAddProductModal(true);
  }

  function openNewProduct() {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      priceKes: 1500,
      carePerk: "Unlocks 1 Private 1-on-1 Counseling Session",
      therapySessionsCount: 1,
      category: "apparel",
      imageUrl: "",
      inStock: true,
    });
    setShowAddProductModal(true);
  }

  // --- Counselors Handlers ---
  async function handleSaveCounselor(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingCounselor(true);
    try {
      if (editingCounselor) {
        // Edit existing
        const res = await fetch("/api/counseling/counselors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCounselor.id,
            ...counselorForm,
          }),
        });
        const data = await res.json();
        if (data.success && data.counselor) {
          setCounselors((prev) =>
            prev.map((c) => (c.id === editingCounselor.id ? data.counselor : c))
          );
          setShowAddCounselorModal(false);
          setEditingCounselor(null);
          setActionMessage("🩺 Counselor details updated successfully!");
        } else {
          setActionMessage(data.error || "Failed to update counselor.");
        }
      } else {
        // Create new
        const res = await fetch("/api/counseling/counselors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(counselorForm),
        });
        const data = await res.json();
        if (data.success && data.counselor) {
          setCounselors((prev) => [data.counselor, ...prev]);
          setShowAddCounselorModal(false);
          setActionMessage("🩺 New counselor added to verified directory!");
        } else {
          setActionMessage(data.error || "Failed to create counselor.");
        }
      }
    } catch {
      setActionMessage("Network error while saving counselor.");
    } finally {
      setIsSavingCounselor(false);
    }
  }

  async function handleDeleteCounselor(id: string) {
    if (!confirm("Are you sure you want to remove this counselor from the active directory?")) return;
    try {
      const res = await fetch(`/api/counseling/counselors?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCounselors((prev) => prev.filter((c) => c.id !== id));
        setActionMessage("Counselor removed from active directory.");
      }
    } catch {
      setActionMessage("Network error while deleting counselor.");
    }
  }

  function openEditCounselor(c: Counselor) {
    setEditingCounselor(c);
    setCounselorForm({
      name: c.name,
      title: c.title,
      specialty: c.specialty,
      bio: c.bio,
      licenseNumber: c.licenseNumber || "",
      isLicensed: c.isLicensed !== false,
      showLicenseNumber: Boolean(c.showLicenseNumber),
      avatarInitials: c.avatarInitials || "",
      isOnline: c.isOnline !== false,
      rating: c.rating || 5.0,
      sessionsCompleted: c.sessionsCompleted || 0,
    });
    setShowAddCounselorModal(true);
  }

  function openNewCounselor() {
    setEditingCounselor(null);
    setCounselorForm({
      name: "",
      title: "Licensed Clinical Psychologist",
      specialty: "Anxiety, Panic & Trauma Support",
      bio: "",
      licenseNumber: "",
      isLicensed: true,
      showLicenseNumber: false,
      avatarInitials: "",
      isOnline: true,
      rating: 4.9,
      sessionsCompleted: 100,
    });
    setShowAddCounselorModal(true);
  }

  // --- Render Authentication Screen ---
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-terracotta-500" />
          Verifying admin access...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fcf9f7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">TFL SafeSpace Staff Admin</h1>
          <p className="text-xs text-slate-500 mb-6">
            Authorized management portal for Gifts, Counselors & Safety Moderation.
          </p>

          {/* Toggle Login Method - High Contrast Tab Pills */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6 text-xs font-bold border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === "password"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("magic_link");
                setAuthError(null);
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === "magic_link"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Magic Link</span>
            </button>
          </div>

          {magicLinkSent ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm space-y-3">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-600" />
              <div>
                <p className="font-bold text-base text-emerald-900 mb-1">Magic Link Dispatched</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  We sent a secure sign-in link to <strong>{emailInput}</strong>. Check your inbox to enter.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs font-bold text-emerald-800 hover:underline pt-2"
              >
                &larr; Try another email or use Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
              {authMode === "password" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Admin Passcode
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password (e.g. safespace2026)"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default: <span className="font-mono text-slate-600">safespace2026</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Authorized Staff Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@talkfreelylifestyle.org"
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 text-sm bg-slate-50/50"
                  />
                  {/* Quick Fill Suggestions */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["admin@talkfreelylifestyle.org", "moderator@talkfreelylifestyle.org"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEmailInput(preset)}
                        className="text-[10px] bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-2 py-1 rounded-md transition-colors font-mono"
                      >
                        +{preset.split("@")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                {isSubmittingAuth ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : authMode === "password" ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In to Admin</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Send Email Magic Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
              &larr; Return to SafeSpace Community
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f7] text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <span>TFL SafeSpace Admin & Staff</span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase">
                  Staff Lead
                </span>
              </h1>
              <p className="text-xs text-slate-500">Signed in as {userEmail}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("moderation")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "moderation"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Moderation ({cases.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("gifts")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "gifts"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Gifts & Store ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("counselors")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "counselors"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Counselors ({counselors.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Public App
            </a>
            <button
              onClick={handleSignOut}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between animate-in fade-in">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold text-amber-700 hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: MODERATION QUEUE */}
        {activeTab === "moderation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Active Review Queue</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated crisis screening flags & community member safety reports.
                </p>
              </div>
              <button
                onClick={loadQueue}
                disabled={isLoadingQueue}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {isLoadingQueue ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-500" />
                <p className="text-sm">Loading queue...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Moderation Queue is Clear</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  No flagged posts or active crisis concerns requiring staff review at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {cases.map((c) => {
                  const isCritical = c.severity === "critical";
                  const isPriority = c.severity === "priority";

                  return (
                    <div
                      key={c.id}
                      className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                        isCritical
                          ? "border-rose-300 ring-2 ring-rose-200/60"
                          : isPriority
                          ? "border-amber-300"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              isCritical
                                ? "bg-rose-100 text-rose-800"
                                : isPriority
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.severity} severity
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            Source: {c.source === "safety_policy" ? "Crisis Screening" : "Community Report"}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                            Target: {c.targetKind}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80 mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Author: @{c.targetAuthorHandle || "Anonymous"}
                          </span>
                          {c.reportReason && (
                            <span className="text-xs font-semibold text-rose-700">
                              Reason: {c.reportReason}
                            </span>
                          )}
                        </div>

                        {c.targetContent && (
                          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {c.targetContent}
                          </p>
                        )}

                        {c.targetAudioUrl && (
                          <div className="pt-2">
                            <VoicePlayer audioUrl={c.targetAudioUrl} />
                          </div>
                        )}
                      </div>

                      {/* Clinical Intervention */}
                      {c.targetKind === "post" && (
                        <div className="mb-4 pb-4 border-b border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              setShowClinicalForm((prev) => ({ ...prev, [c.id]: !prev[c.id] }))
                            }
                            className="text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2"
                          >
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            {showClinicalForm[c.id]
                              ? "Close Clinical Response Form"
                              : "💙 Post Verified Clinical Response & Open Private Crisis Room"}
                          </button>

                          {showClinicalForm[c.id] && (
                            <div className="mt-3 p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                              <textarea
                                rows={3}
                                placeholder="Type empathetic clinical response for this community member..."
                                value={clinicalReplyText[c.id] || ""}
                                onChange={(e) =>
                                  setClinicalReplyText({
                                    ...clinicalReplyText,
                                    [c.id]: e.target.value,
                                  })
                                }
                                className="w-full text-xs p-3 rounded-xl border border-teal-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <label className="flex items-center gap-2 text-xs font-medium text-teal-900 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={clinicalInviteChat[c.id] !== false}
                                    onChange={(e) =>
                                      setClinicalInviteChat({
                                        ...clinicalInviteChat,
                                        [c.id]: e.target.checked,
                                      })
                                    }
                                    className="rounded text-teal-600 focus:ring-teal-500"
                                  />
                                  <span>Open & link confidential 1-on-1 private crisis room</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => handleClinicalSubmit(c.id)}
                                  disabled={actionLoading === c.id || !clinicalReplyText[c.id]?.trim()}
                                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  {actionLoading === c.id ? "Sending..." : "Post Clinical Reply & Resolve"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Bar */}
                      <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <input
                          type="text"
                          placeholder="Audit note / reason..."
                          value={actionReason[c.id] || ""}
                          onChange={(e) =>
                            setActionReason({ ...actionReason, [c.id]: e.target.value })
                          }
                          className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 w-full md:w-72"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleModerationAction(c.id, "hide")}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            Hide
                          </button>

                          <button
                            onClick={() => handleModerationAction(c.id, "remove")}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>

                          <button
                            onClick={() => handleModerationAction(c.id, "suspend")}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            Suspend
                          </button>

                          <button
                            onClick={() => handleModerationAction(c.id, "dismiss")}
                            disabled={actionLoading === c.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Keep / Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GIFTS & STORE MANAGEMENT */}
        {activeTab === "gifts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Care Gifts & Merchandise</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add, update prices, or adjust counseling session perks unlocked by each gift.
                </p>
              </div>
              <button
                onClick={openNewProduct}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Gift
              </button>
            </div>

            {isLoadingProducts ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-500" />
                <p className="text-sm">Loading gifts...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Gift Items</h3>
                <p className="text-xs text-slate-500 mb-4">Click below to add your first store gift.</p>
                <button
                  onClick={openNewProduct}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white"
                >
                  Add Gift
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {p.imageUrl ? (
                        <div className="w-full h-36 rounded-2xl overflow-hidden border border-rose-100 bg-slate-50 mb-2">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          {p.category}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            p.inStock !== false
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.inStock !== false ? "Active" : "Archived"}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                        <p className="text-lg font-mono font-bold text-rose-600 mt-0.5">
                          {p.priceKes.toLocaleString()} KES
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="line-clamp-1">{p.carePerk}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {p.therapySessionsCount} {p.therapySessionsCount === 1 ? "Session" : "Sessions"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Gift"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Gift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COUNSELORS MANAGEMENT */}
        {activeTab === "counselors" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Manage Verified Counselors & Psychologists</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add psychologists, configure specialties, and toggle Kenya Board license verification badges.
                </p>
              </div>
              <button
                onClick={openNewCounselor}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Counselor
              </button>
            </div>

            {isLoadingCounselors ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-500" />
                <p className="text-sm">Loading counselors...</p>
              </div>
            ) : counselors.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-rose-100 shadow-sm">
                <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Counselors Added</h3>
                <p className="text-xs text-slate-500 mb-4">Click below to add your first counselor.</p>
                <button
                  onClick={openNewCounselor}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 text-white"
                >
                  Add Counselor
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {counselors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          {c.avatarInitials || "CN"}
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            c.isOnline
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {c.isOnline ? "Online & Active" : "Offline"}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                        <p className="text-xs text-rose-600 font-semibold">{c.title}</p>
                        
                        {/* Kenya Board License / Verified Badge */}
                        <div className="mt-1 flex items-center gap-1.5">
                          {c.isLicensed !== false ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Kenya Board Verified
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Not Board Verified</span>
                          )}

                          {c.showLicenseNumber && c.licenseNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({c.licenseNumber})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                        🎯 {c.specialty}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {c.bio}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {c.rating} ({c.sessionsCompleted}+ sessions)
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditCounselor(c)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit Counselor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCounselor(c.id)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Delete Counselor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- ADD / EDIT GIFT MODAL --- */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingProduct ? "Edit Care Gift Product" : "Add New Care Gift Product"}
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TFL Guided Anxiety & Healing Journal"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Price (KES)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="1500"
                    value={productForm.priceKes}
                    onChange={(e) => setProductForm({ ...productForm, priceKes: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as "apparel" | "stationery" | "accessories" | "service",
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 bg-white"
                  >
                    <option value="apparel">Apparel (Hoodies/Tees)</option>
                    <option value="stationery">Stationery (Journals/Cards)</option>
                    <option value="accessories">Accessories (Bands/Totes)</option>
                    <option value="service">Direct Counseling Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Care Perk Description (Unlocked Sessions)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unlocks 1 Private 1-on-1 Counseling Session"
                  value={productForm.carePerk}
                  onChange={(e) => setProductForm({ ...productForm, carePerk: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sessions Count</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={productForm.therapySessionsCount}
                    onChange={(e) => setProductForm({ ...productForm, therapySessionsCount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.inStock}
                      onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Active in Store</span>
                  </label>
                </div>
              </div>

              {/* Product Photo Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Product Image / Photo
                </label>

                {productForm.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-rose-200 bg-slate-50 group">
                    <img
                      src={productForm.imageUrl}
                      alt="Product Preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-sm hover:bg-slate-100 transition-colors">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProductImageFile(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: "" }))}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-sm hover:bg-rose-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                    {isUploadingImage ? (
                      <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold py-3">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Uploading product photo...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-rose-600 block">
                            Click to upload product image
                          </span>
                          <span className="text-[10px] text-slate-400">
                            PNG, JPG, WEBP up to 5MB
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProductImageFile(file);
                          }}
                        />
                      </>
                    )}
                  </label>
                )}

                {imageUploadError && (
                  <p className="text-[11px] text-rose-600 font-medium">{imageUploadError}</p>
                )}

                <div>
                  <input
                    type="url"
                    placeholder="Or paste external image URL (optional)"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 font-mono text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of the gift and materials..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {isSavingProduct ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct ? "Update Gift" : "Add Gift to Catalog"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT COUNSELOR MODAL --- */}
      {showAddCounselorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-900">
                {editingCounselor ? "Edit Verified Counselor" : "Add New Verified Counselor"}
              </h3>
              <button
                onClick={() => setShowAddCounselorModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCounselor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name & Degree</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Faith Mwangi, PhD"
                  value={counselorForm.name}
                  onChange={(e) => setCounselorForm({ ...counselorForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Professional Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Licensed Clinical Psychologist"
                    value={counselorForm.title}
                    onChange={(e) => setCounselorForm({ ...counselorForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Avatar Initials</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="FM"
                    value={counselorForm.avatarInitials}
                    onChange={(e) => setCounselorForm({ ...counselorForm, avatarInitials: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Kenya Board License Boolean Toggle Feature */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={counselorForm.isLicensed}
                      onChange={(e) => setCounselorForm({ ...counselorForm, isLicensed: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Kenya Board Verified (Yes / No)</span>
                  </label>
                  <span className="text-[11px] text-emerald-700 font-medium">Shows verified badge</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-100">
                  <label className="flex items-center gap-2 text-xs text-emerald-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={counselorForm.showLicenseNumber}
                      onChange={(e) => setCounselorForm({ ...counselorForm, showLicenseNumber: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Display Raw License Number in public profile</span>
                  </label>
                </div>

                {counselorForm.showLicenseNumber && (
                  <div>
                    <input
                      type="text"
                      placeholder="Kenya License No (e.g. KPsyA-4821)"
                      value={counselorForm.licenseNumber}
                      onChange={(e) => setCounselorForm({ ...counselorForm, licenseNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-200 text-xs bg-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Core Specialty</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anxiety, Panic, Grief & Young Adult Transition"
                  value={counselorForm.specialty}
                  onChange={(e) => setCounselorForm({ ...counselorForm, specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Therapist Bio & Approach</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Warm, compassionate counseling background..."
                  value={counselorForm.bio}
                  onChange={(e) => setCounselorForm({ ...counselorForm, bio: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sessions Completed</label>
                  <input
                    type="number"
                    min="0"
                    value={counselorForm.sessionsCompleted}
                    onChange={(e) => setCounselorForm({ ...counselorForm, sessionsCompleted: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={counselorForm.isOnline}
                      onChange={(e) => setCounselorForm({ ...counselorForm, isOnline: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Available for 1-on-1</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCounselorModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCounselor}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {isSavingCounselor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingCounselor ? "Update Counselor" : "Add to Directory"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
