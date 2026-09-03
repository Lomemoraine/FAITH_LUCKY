export type RoomSlug = "all" | "anxiety" | "relationships" | "burnout" | "grief" | "wins";

export type ProfileStatus = "active" | "suspended" | "deleting";

export interface PublicProfile {
  public_id: string;
  anonymous_handle: string;
  avatar_id: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface PublicReply {
  id: string;
  postId: string;
  authorHandle: string;
  authorAvatar: string;
  authorPublicId: string;
  content: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
  createdAt: string;
  isAuthor: boolean;
}

export interface PublicPost {
  id: string;
  roomId: string;
  roomName: string;
  authorHandle: string;
  authorAvatar: string;
  authorPublicId: string;
  content: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
  empathyCount: number;
  hasLiked: boolean;
  replies: PublicReply[];
  createdAt: string;
  isAuthor: boolean;
}

export type ReportReason =
  | "harassment"
  | "hate"
  | "dangerous_advice"
  | "privacy"
  | "spam"
  | "crisis_concern"
  | "other";

export type ModerationSeverity = "standard" | "priority" | "critical";
export type ModerationStatus = "open" | "in_review" | "resolved" | "dismissed";
export type ModerationActionType = "hide" | "restore" | "remove" | "suspend" | "unsuspend" | "dismiss" | "clinical_reply";

export interface ModerationCase {
  id: string;
  source: "safety_policy" | "user_report";
  severity: ModerationSeverity;
  targetKind: "post" | "reply";
  postId?: string | null;
  replyId?: string | null;
  status: ModerationStatus;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  targetContent?: string;
  targetAuthorHandle?: string;
  targetAuthorId?: string;
  targetAudioUrl?: string | null;
  reportReason?: string;
  reportContext?: string;
}

export interface ModerationAction {
  id: string;
  caseId: string;
  moderatorId: string;
  action: ModerationActionType;
  reason: string;
  createdAt: string;
}

export interface KenyaCrisisResource {
  name: string;
  phone: string;
  displayPhone: string;
  description: string;
  availableHours: string;
  tollFree: boolean;
}

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  priceKes: number;
  carePerk: string;
  therapySessionsCount: number;
  imageUrl?: string;
  category: "apparel" | "stationery" | "accessories" | "service";
  inStock?: boolean;
}

export interface CareVoucher {
  id: string;
  code: string;
  therapySessions: number;
  perkDescription: string;
  status: "active" | "redeemed" | "expired";
  buyerPhone?: string;
  redeemedAt?: string | null;
  createdAt: string;
}

export interface StoreOrder {
  id: string;
  orderNumber: string;
  productId: string;
  itemName: string;
  amountKes: number;
  phoneNumber: string;
  shippingAddress?: string;
  paymentMethod: "mpesa_stk";
  paymentStatus: "pending" | "completed" | "failed";
  mpesaReceiptNumber?: string;
  voucherCode?: string;
  createdAt: string;
}

export interface Counselor {
  id: string;
  name: string;
  title: string;
  licenseNumber?: string;
  isLicensed?: boolean;
  showLicenseNumber?: boolean;
  specialty: string;
  bio: string;
  avatarInitials: string;
  isOnline: boolean;
  rating: number;
  sessionsCompleted: number;
}

export interface CounselingMessage {
  id: string;
  sessionId: string;
  senderRole: "client" | "counselor" | "system";
  content: string;
  createdAt: string;
}

export interface CounselingSession {
  id: string;
  clientId: string;
  counselorId: string;
  counselor: Counselor;
  voucherId?: string | null;
  status: "active" | "completed" | "cancelled";
  primaryConcern?: string;
  intakeMood?: string;
  createdAt: string;
  messages: CounselingMessage[];
}

