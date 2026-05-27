/**
 * PostgREST cần chỉ rõ FK khi bảng có nhiều quan hệ tới cùng một bảng (vd. purchased_accounts → users).
 * @see https://supabase.com/docs/guides/database/joins-and-nested-tables
 */

/** Khách thuê (user_id) */
export const purchasedAccountUserEmbed =
  'users!purchased_accounts_user_id_fkey'

/** Người tạo ticket */
export const supportTicketUserEmbed = 'users!support_tickets_user_id_fkey'
