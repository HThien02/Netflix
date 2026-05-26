import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { allocateSlots, calcPriceBySlots, ensureMinimumPool, getPoolInventorySummary } from '@/lib/inventory/pool'
import { sendPaymentSuccessEmail, sendAdminNewOrderEmail } from '@/lib/email/send'
import { formatCurrency } from '@/lib/utils/format'
import { addPlanExpiry, isShortTermPlan } from '@/lib/plans'
import type { Cart, PurchasedAccount, Invoice, Lang } from '@/lib/types'

export type CompleteOrderInput = {
  userId: string
  userEmail: string
  userName: string
  language: Lang
  cart: Cart
  productNames: Record<string, string>
  paymentMethod: 'payos' | 'sepay' | 'credit_card' | 'wallet'
}

export async function completeOrderServer(input: CompleteOrderInput) {
  const { userId, userEmail, userName, language, cart, productNames, paymentMethod } = input
  const now = new Date()
  const invoiceNumber = `INV-${Date.now()}`
  const accounts: PurchasedAccount[] = []

  for (const item of cart.items) {
    const productName = productNames[item.productId] || item.productName || 'Streaming'
    const slots = isShortTermPlan(item.planType) ? 1 : Math.min(4, Math.max(1, item.slots || 1))
    const allocation = await allocateSlots(slots, item.productId)

    if (!allocation) {
      throw new Error(
        language === 'vi'
          ? `Không còn đủ ${slots} slot trống trong kho`
          : `Not enough ${slots} free slot(s) in pool`,
      )
    }

    const expiresAt = addPlanExpiry(now, item.planType)

    const slotNotes = allocation.assignedSlots
      .map((s) => `Slot ${s.slot_number}: ${s.profile_name}${s.pin ? ` (PIN: ${s.pin})` : ''}`)
      .join('\n')

    accounts.push({
      id: crypto.randomUUID(),
      userId,
      productId: item.productId,
      productName,
      planType: item.planType,
      serviceEmail: allocation.serviceEmail,
      servicePassword: allocation.servicePassword,
      profileName: allocation.assignedSlots.map((s) => s.profile_name).join(', '),
      extraNotes: slotNotes,
      slotsCount: slots,
      poolAccountId: allocation.poolAccountId,
      slotAssignments: allocation.assignedSlots,
      expiresAt,
      status: 'active',
      createdAt: now,
    })
  }

  const invoice: Invoice = {
    id: crypto.randomUUID(),
    userId,
    subscriptionId: accounts[0]?.id || '',
    amount: cart.subtotal,
    taxAmount: cart.taxAmount,
    totalAmount: cart.total,
    status: 'paid',
    paymentMethod,
    invoiceDate: now,
    dueDate: now,
    paidDate: now,
    createdAt: now,
    updatedAt: now,
    invoiceNumber,
    items: cart.items.map((item) => ({
      productName: productNames[item.productId] || item.productName || 'Product',
      planType: item.planType,
      price: item.price,
      slots: item.slots,
    })),
  }

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient()
    const { data: invRow, error: invError } = await supabase
      .from('invoices')
      .insert({
        user_id: userId,
        total_amount: cart.subtotal,
        tax_amount: cart.taxAmount,
        discount_amount: cart.discount,
        final_amount: cart.total,
        status: 'completed',
        payment_method: paymentMethod,
        invoice_number: invoiceNumber,
      })
      .select('id')
      .single()

    if (!invError && invRow) {
      invoice.id = invRow.id

      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i]
        const acc = accounts[i]
        const endDate = addPlanExpiry(now, item.planType)

        const { data: subRow } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            product_id: item.productId,
            status: 'active',
            plan_type: item.planType,
            price: item.price,
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            auto_renew: false,
          })
          .select('id')
          .single()

        const { data: accRow } = await supabase
          .from('purchased_accounts')
          .insert({
            user_id: userId,
            invoice_id: invRow.id,
            subscription_id: subRow?.id ?? null,
            product_id: item.productId,
            product_name: acc.productName,
            plan_type: item.planType,
            service_email: acc.serviceEmail,
            service_password: acc.servicePassword,
            profile_name: acc.profileName,
            extra_notes: acc.extraNotes,
            slots_count: acc.slotsCount,
            pool_account_id: acc.poolAccountId,
            slot_assignments: acc.slotAssignments,
            expires_at: endDate.toISOString(),
            status: 'active',
          })
          .select('*')
          .single()

        if (accRow) {
          accounts[i] = mapDbAccount(accRow)
        }
      }
    }
  }

  await ensureMinimumPool()

  const summary = await getPoolInventorySummary()
  const poolSummaryText =
    language === 'vi'
      ? `Tổng account pool: ${summary.totalAccounts}\nCòn trống 4 slot: ${summary.byFreeSlots[4]}\nCòn trống 3 slot: ${summary.byFreeSlots[3]}\nCòn trống 2 slot: ${summary.byFreeSlots[2]}\nCòn trống 1 slot: ${summary.byFreeSlots[1]}\nTổng slot trống: ${summary.totalFreeSlots}`
      : `Total pool accounts: ${summary.totalAccounts}\nWith 4 free slots: ${summary.byFreeSlots[4]}\nWith 3 free slots: ${summary.byFreeSlots[3]}\nWith 2 free slots: ${summary.byFreeSlots[2]}\nWith 1 free slot: ${summary.byFreeSlots[1]}\nTotal free slots: ${summary.totalFreeSlots}`

  const first = accounts[0]
  const productLabel = first?.productName || 'Order'
  const slotLines =
    first?.slotAssignments?.map(
      (s) =>
        `${s.profile_name} (slot ${s.slot_number})${s.pin ? ` PIN ${s.pin}` : ''} — ${first.serviceEmail}`,
    ) || []

  try {
    await sendPaymentSuccessEmail(
      userEmail,
      userName,
      language,
      invoiceNumber,
      formatCurrency(cart.total),
      accounts.map((a) => `${a.productName} · ${a.slotsCount} slot`),
    )
    await sendAdminNewOrderEmail(language, {
      customerName: userName,
      customerEmail: userEmail,
      invoiceNumber,
      total: formatCurrency(cart.total),
      productName: productLabel,
      slotsCount: first?.slotsCount || 1,
      slotLines,
      poolSummary: poolSummaryText,
    })
  } catch (emailErr) {
    console.error('[complete-order] email failed (order still saved)', emailErr)
  }

  return { invoice, accounts }
}

function mapDbAccount(row: Record<string, unknown>): PurchasedAccount {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    invoiceId: row.invoice_id ? String(row.invoice_id) : undefined,
    subscriptionId: row.subscription_id ? String(row.subscription_id) : undefined,
    productId: row.product_id ? String(row.product_id) : undefined,
    productName: String(row.product_name),
    planType: (row.plan_type as PurchasedAccount['planType']) || 'monthly',
    serviceEmail: String(row.service_email),
    servicePassword: String(row.service_password),
    profileName: row.profile_name ? String(row.profile_name) : undefined,
    extraNotes: row.extra_notes ? String(row.extra_notes) : undefined,
    slotsCount: Number(row.slots_count) || 1,
    poolAccountId: row.pool_account_id ? String(row.pool_account_id) : undefined,
    slotAssignments: Array.isArray(row.slot_assignments) ? row.slot_assignments : [],
    expiresAt: new Date(String(row.expires_at)),
    status: (row.status as PurchasedAccount['status']) || 'active',
    createdAt: new Date(String(row.created_at)),
  }
}

export { calcPriceBySlots }
