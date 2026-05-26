import type { PlanType } from '@/lib/plans'
export type { PlanType }

// User Types
export interface User {
  id: string
  email: string
  password: string
  fullName: string
  role: 'customer' | 'merchant' | 'admin'
  avatar?: string
  language: 'vi' | 'en'
  createdAt: Date
  updatedAt: Date
  profile?: UserProfile
}

export interface UserProfile {
  userId: string
  phone?: string
  address?: string
  city?: string
  country?: string
  dateOfBirth?: Date
  vipTier?: 'bronze' | 'silver' | 'gold' | 'platinum'
  vipExpiresAt?: Date
}

// Product Types
export interface Product {
  id: string
  merchantId: string
  name: string
  description: string
  nameEn?: string
  descriptionEn?: string
  image: string
  category: string
  basePrice: number
  discountPercentage?: number
  active: boolean
  /** Hiển thị trên marketplace nhưng chưa cho mua */
  comingSoon?: boolean
  createdAt: Date
  updatedAt: Date
}

// Subscription Types
export interface Subscription {
  id: string
  userId: string
  productId: string
  planType: PlanType
  status: 'active' | 'cancelled' | 'expired' | 'paused'
  startDate: Date
  renewalDate: Date
  endDate?: Date
  autoRenew: boolean
  price: number
  nextBillingDate: Date
  createdAt: Date
  updatedAt: Date
  productName?: string
}

// Invoice Types
export interface Invoice {
  id: string
  userId: string
  subscriptionId: string
  amount: number
  taxAmount: number
  totalAmount: number
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentMethod: 'payos' | 'sepay' | 'credit_card' | 'wallet'
  invoiceDate: Date
  dueDate: Date
  paidDate?: Date
  invoiceNumber?: string
  items?: Array<{ productName: string; planType: string; price: number }>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// Purchased account credentials (delivered after payment)
export interface PurchasedAccount {
  id: string
  userId: string
  invoiceId?: string
  subscriptionId?: string
  productId?: string
  productName: string
  planType: PlanType
  serviceEmail: string
  servicePassword: string
  profileName?: string
  extraNotes?: string
  slotsCount?: number
  poolAccountId?: string
  slotAssignments?: Array<{ slot_number: number; profile_name: string; pin?: string }>
  expiresAt: Date
  status: 'active' | 'expired' | 'revoked'
  userRating?: number
  userReview?: string
  ratedAt?: Date
  createdAt: Date
}

// Inventory Types
export interface InventoryAccount {
  id: string
  merchantId: string
  productId: string
  quantity: number
  reserved: number
  allocated: number
  allocations: InventoryAllocation[]
  createdAt: Date
  updatedAt: Date
}

export interface InventoryAllocation {
  id: string
  accountId: string
  subscriptionId: string
  quantity: number
  status: 'active' | 'used' | 'cancelled'
  allocatedAt: Date
  expiresAt?: Date
}

// Coupon Types
export interface Coupon {
  id: string
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses: number
  currentUses: number
  expiryDate: Date
  minAmount?: number
  applicableProducts: string[]
  active: boolean
  createdAt: Date
}

// Support Ticket Types
export type SupportTicketAttachment = {
  url: string
  name: string
  mimeType: string
  size: number
}

export interface SupportTicket {
  id: string
  userId: string
  /** Chỉ có khi admin xem danh sách */
  userEmail?: string
  userName?: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  attachments?: SupportTicketAttachment[]
  adminResponse?: string
  adminRespondedAt?: Date
  messages: TicketMessage[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

export interface TicketMessage {
  id: string
  ticketId: string
  userId: string
  message: string
  attachments?: string[]
  createdAt: Date
}

// Transaction Types
export interface Transaction {
  id: string
  userId: string
  invoiceId: string
  amount: number
  type: 'debit' | 'credit'
  method: 'payos' | 'sepay' | 'credit_card' | 'wallet' | 'refund'
  status: 'pending' | 'completed' | 'failed'
  reference: string
  failureReason?: string
  createdAt: Date
}

// Merchant Types
export interface Merchant {
  id: string
  userId: string
  storeName: string
  description: string
  logo?: string
  banner?: string
  email: string
  phone: string
  address: string
  isVerified: boolean
  rating: number
  totalSales: number
  totalRevenue: number
  createdAt: Date
  updatedAt: Date
}

// Cart Types
export interface CartItem {
  id: string
  productId: string
  quantity: number
  planType: PlanType
  /** Số slot/profile (1–4) — giá = base × slots; gói ngắn hạn luôn = 1 */
  slots: number
  price: number
  productName?: string
}

export interface Cart {
  id: string
  userId: string
  items: CartItem[]
  subtotal: number
  taxAmount: number
  discount: number
  couponCode?: string
  total: number
  updatedAt: Date
}

// Session/Auth Types
export interface AuthSession {
  userId: string
  email: string
  role: 'customer' | 'merchant' | 'admin'
  token: string
  expiresAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Analytics Types
export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeSubscriptions: number
  churnRate: number
  avgOrderValue: number
  growth: {
    revenue: number
    orders: number
    subscriptions: number
  }
}

export interface MerchantStats {
  totalSales: number
  totalRevenue: number
  activeSubscriptions: number
  productsSold: number
  averageRating: number
  topProducts: Array<{
    productId: string
    sales: number
    revenue: number
  }>
}
