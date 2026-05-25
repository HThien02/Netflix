import { User, Product, Subscription, Invoice, Merchant, Coupon, SupportTicket, Transaction, InventoryAccount } from './types'
import { v4 as uuidv4 } from 'uuid'

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@example.com',
    password: 'hashed_password_1',
    fullName: 'John Doe',
    role: 'customer',
    language: 'en',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-05-20'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    password: 'hashed_password_2',
    fullName: 'Jane Smith',
    role: 'customer',
    language: 'vi',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-05-18'),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    profile: {
      userId: 'user-2',
      phone: '0812345678',
      vipTier: 'gold',
      vipExpiresAt: new Date('2024-12-31'),
    },
  },
  {
    id: 'merchant-1',
    email: 'merchant@example.com',
    password: 'hashed_password_3',
    fullName: 'Premium Content Co',
    role: 'merchant',
    language: 'en',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'admin-1',
    email: 'admin@example.com',
    password: 'hashed_password_4',
    fullName: 'Admin User',
    role: 'admin',
    language: 'en',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-05-20'),
  },
]

// Mock Merchants
export const mockMerchants: Merchant[] = [
  {
    id: 'merchant-1',
    userId: 'merchant-1',
    storeName: 'Premium Content Co',
    description: 'Your ultimate destination for premium streaming content',
    email: 'merchant@example.com',
    phone: '+1-800-123-4567',
    address: '123 Main Street, San Francisco, CA',
    isVerified: true,
    rating: 4.8,
    totalSales: 2840,
    totalRevenue: 142000,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'merchant-2',
    userId: 'merchant-2',
    storeName: 'Global Streaming Network',
    description: 'International streaming services with 24/7 support',
    email: 'merchant2@example.com',
    phone: '+1-800-987-6543',
    address: '456 Tech Avenue, Austin, TX',
    isVerified: true,
    rating: 4.6,
    totalSales: 1920,
    totalRevenue: 96000,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-05-20'),
  },
]

// Mock Products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    merchantId: 'merchant-1',
    name: 'Premium Plus',
    description: '4K Ultra HD streaming, simultaneous screens, offline download',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&h=300&fit=crop',
    category: 'streaming',
    basePrice: 10_000,
    discountPercentage: 10,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'prod-2',
    merchantId: 'merchant-1',
    name: 'Standard HD',
    description: '1080p HD streaming, 2 simultaneous screens',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    category: 'streaming',
    basePrice: 10_000,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'prod-3',
    merchantId: 'merchant-1',
    name: 'Basic',
    description: '720p HD streaming, single screen',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=300&fit=crop',
    category: 'streaming',
    basePrice: 10_000,
    discountPercentage: 15,
    active: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'prod-4',
    merchantId: 'merchant-2',
    name: 'Global Plus',
    description: 'Access to 10000+ international shows and movies',
    image: 'https://images.unsplash.com/photo-1520764185298-1b434c919eba?w=500&h=300&fit=crop',
    category: 'streaming',
    basePrice: 10_000,
    active: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 'prod-5',
    merchantId: 'merchant-2',
    name: 'Family Bundle',
    description: '6 profiles, parental controls, 4 simultaneous screens',
    image: 'https://images.unsplash.com/photo-1522869635100-ce306256633a?w=500&h=300&fit=crop',
    category: 'streaming',
    basePrice: 10_000,
    discountPercentage: 20,
    active: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-05-20'),
  },
]

// Mock Subscriptions
export const mockSubscriptions: Subscription[] = Array.from({ length: 45 }, (_, i) => {
  const statuses: Array<'active' | 'cancelled' | 'expired' | 'paused'> = ['active', 'cancelled', 'expired', 'paused']
  const planTypes: Array<'monthly' | 'quarterly' | 'annual'> = ['monthly', 'quarterly', 'annual']
  const productIds = mockProducts.map(p => p.id)
  
  const baseDate = new Date('2024-01-01')
  baseDate.setDate(baseDate.getDate() + i * 3)
  
  return {
    id: `sub-${i + 1}`,
    userId: i % 2 === 0 ? 'user-1' : 'user-2',
    productId: productIds[i % productIds.length],
    planType: planTypes[i % 3],
    status: statuses[i % 4],
    startDate: baseDate,
    renewalDate: new Date(baseDate.getTime() + (i % 3 + 1) * 30 * 24 * 60 * 60 * 1000),
    endDate: i % 4 === 1 ? new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000) : undefined,
    autoRenew: i % 3 !== 0,
    price: mockProducts[i % mockProducts.length].basePrice,
    nextBillingDate: new Date(baseDate.getTime() + (i % 3 + 1) * 30 * 24 * 60 * 60 * 1000),
    createdAt: baseDate,
    updatedAt: new Date(),
  }
})

// Mock Invoices
export const mockInvoices: Invoice[] = Array.from({ length: 60 }, (_, i) => {
  const statuses: Array<'pending' | 'paid' | 'failed' | 'refunded'> = ['pending', 'paid', 'failed', 'refunded']
  const paymentMethods: Array<'payos' | 'credit_card' | 'wallet'> = ['payos', 'credit_card', 'wallet']
  
  const baseDate = new Date('2024-01-01')
  baseDate.setDate(baseDate.getDate() + i * 2)
  
  const amount = 9.99 + (i % 50)
  const taxAmount = amount * 0.1
  const totalAmount = amount + taxAmount
  
  return {
    id: `inv-${i + 1}`,
    userId: i % 2 === 0 ? 'user-1' : 'user-2',
    subscriptionId: `sub-${(i % 45) + 1}`,
    amount,
    taxAmount,
    totalAmount,
    status: statuses[i % 4],
    paymentMethod: paymentMethods[i % 3],
    invoiceDate: baseDate,
    dueDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
    paidDate: i % 4 !== 2 ? new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) : undefined,
    createdAt: baseDate,
    updatedAt: new Date(),
  }
})

// Mock Coupons
export const mockCoupons: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'SAVE20',
    description: '20% off all subscriptions',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 1000,
    currentUses: 347,
    expiryDate: new Date('2024-12-31'),
    applicableProducts: mockProducts.map(p => p.id),
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'coupon-2',
    code: 'FIRST10',
    description: '10% off for first-time users',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 5000,
    currentUses: 1823,
    expiryDate: new Date('2024-12-31'),
    applicableProducts: mockProducts.map(p => p.id),
    active: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'coupon-3',
    code: 'ANNUAL50',
    description: 'Giảm 50.000đ cho gói năm',
    discountType: 'fixed',
    discountValue: 100,
    maxUses: 500,
    currentUses: 234,
    expiryDate: new Date('2024-11-30'),
    minAmount: 500,
    applicableProducts: mockProducts.filter(p => p.category === 'streaming').map(p => p.id),
    active: true,
    createdAt: new Date('2024-03-01'),
  },
]

// Mock Support Tickets
export const mockSupportTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    userId: 'user-1',
    subject: 'Billing issue with last payment',
    description: 'I was charged twice for my subscription last month',
    priority: 'high',
    status: 'resolved',
    messages: [
      {
        id: 'msg-1',
        ticketId: 'ticket-1',
        userId: 'user-1',
        message: 'I was charged twice for my subscription last month',
        createdAt: new Date('2024-05-15'),
      },
      {
        id: 'msg-2',
        ticketId: 'ticket-1',
        userId: 'admin-1',
        message: 'We apologize for the inconvenience. We have processed a refund for the duplicate charge.',
        createdAt: new Date('2024-05-16'),
      },
    ],
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-16'),
    resolvedAt: new Date('2024-05-16'),
  },
  {
    id: 'ticket-2',
    userId: 'user-2',
    subject: 'Unable to access content',
    description: 'Some shows are not loading properly',
    priority: 'medium',
    status: 'in_progress',
    messages: [
      {
        id: 'msg-3',
        ticketId: 'ticket-2',
        userId: 'user-2',
        message: 'Some shows are not loading properly on my mobile device',
        createdAt: new Date('2024-05-18'),
      },
      {
        id: 'msg-4',
        ticketId: 'ticket-2',
        userId: 'admin-1',
        message: 'We are investigating this issue. Please clear your app cache and try again.',
        createdAt: new Date('2024-05-19'),
      },
    ],
    createdAt: new Date('2024-05-18'),
    updatedAt: new Date('2024-05-19'),
  },
]

// Mock Transactions
export const mockTransactions: Transaction[] = Array.from({ length: 40 }, (_, i) => {
  const types: Array<'debit' | 'credit'> = ['debit', 'credit']
  const methods: Array<'payos' | 'credit_card' | 'wallet' | 'refund'> = ['payos', 'credit_card', 'wallet', 'refund']
  const statuses: Array<'pending' | 'completed' | 'failed'> = ['pending', 'completed', 'failed']
  
  const baseDate = new Date('2024-04-01')
  baseDate.setDate(baseDate.getDate() + i)
  
  const type = types[i % 2]
  const amount = type === 'debit' ? (10 + (i % 50)) : (5 + (i % 20))
  
  return {
    id: `txn-${i + 1}`,
    userId: i % 2 === 0 ? 'user-1' : 'user-2',
    invoiceId: `inv-${(i % 60) + 1}`,
    amount,
    type,
    method: methods[i % 4],
    status: statuses[i % 3],
    reference: `REF-${i + 1000}`,
    failureReason: i % 3 === 2 ? 'Insufficient funds' : undefined,
    createdAt: baseDate,
  }
})

// Mock Inventory Accounts
export const mockInventoryAccounts: InventoryAccount[] = mockProducts.map((product, i) => ({
  id: `inv-acc-${product.id}`,
  merchantId: product.merchantId,
  productId: product.id,
  quantity: 1000 + (i * 100),
  reserved: (i + 1) * 50,
  allocated: (i + 1) * 30,
  allocations: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
}))

// Mock session user (logged in user)
export const mockCurrentUser: User = {
  id: 'user-1',
  email: 'john@example.com',
  password: 'hashed_password_1',
  fullName: 'John Doe',
  role: 'customer',
  language: 'en',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-05-20'),
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
}
