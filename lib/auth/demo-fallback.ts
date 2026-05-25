import type { User } from '@/lib/types'

/** Offline fallback when Supabase is not configured or unreachable */
const DEMO_USERS: Record<string, User> = {
  'customer1@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'customer1@example.com',
    password: '',
    fullName: 'Nguyễn Văn A',
    role: 'customer',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440001', phone: '0912345678' },
  },
  'customer2@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'customer2@example.com',
    password: '',
    fullName: 'Trần Thị B',
    role: 'customer',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440002', phone: '0923456789' },
  },
  'customer3@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'customer3@example.com',
    password: '',
    fullName: 'Phạm Văn C',
    role: 'customer',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440003', phone: '0934567890' },
  },
  'merchant1@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'merchant1@example.com',
    password: '',
    fullName: 'Hoàng Thị D',
    role: 'merchant',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440004', phone: '0945678901' },
  },
  'merchant2@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'merchant2@example.com',
    password: '',
    fullName: 'Bùi Văn E',
    role: 'merchant',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440005', phone: '0956789012' },
  },
  'admin@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440006',
    email: 'admin@example.com',
    password: '',
    fullName: 'Lê Quốc F',
    role: 'admin',
    language: 'vi',
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: { userId: '550e8400-e29b-41d4-a716-446655440006', phone: '0967890123' },
  },
}

export function loginWithDemoFallback(
  email: string,
  password: string,
): User | null {
  const key = email.toLowerCase().trim()
  const user = DEMO_USERS[key]
  if (user && password === 'demo123') return user
  return null
}

export function getDemoUserById(userId: string): User | null {
  return Object.values(DEMO_USERS).find((u) => u.id === userId) || null
}
