-- payos_pending_orders: chỉ server (service_role) ghi/đọc — không expose qua anon
ALTER TABLE public.payos_pending_orders ENABLE ROW LEVEL SECURITY;

-- Không tạo policy cho anon/authenticated → client không đọc/ghi được
-- service_role bypass RLS mặc định trên Supabase

COMMENT ON TABLE public.payos_pending_orders IS
  'PayOS checkout buffer; API must use SUPABASE_SERVICE_ROLE_KEY';
