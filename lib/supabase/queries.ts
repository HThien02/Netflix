import { createClient } from './client'

// Get all products
export async function getProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get single product
export async function getProduct(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

// Get user by email
export async function getUserByEmail(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) return null
  return data
}

// Get user subscriptions
export async function getUserSubscriptions(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get user invoices
export async function getUserInvoices(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, subscriptions(products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get merchant store
export async function getMerchantStore(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('merchant_stores')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

// Get all coupons
export async function getCoupons() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get support tickets for user
export async function getUserSupportTickets(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get VIP tiers
export async function getVIPTiers() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vip_tiers')
    .select('*')
    .order('level', { ascending: true })

  if (error) return []
  return data || []
}

// Get user VIP status
export async function getUserVIPStatus(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_vip_status')
    .select('*, vip_tiers(*)')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

// Get purchased accounts (credentials) for user
export async function getUserPurchasedAccounts(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('purchased_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}

// Get merchant products inventory
export async function getMerchantInventory(merchantId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory')
    .select('*, products(*)')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}
