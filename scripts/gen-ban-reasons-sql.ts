import { writeFileSync } from 'fs'
import { catalogWithSortOrder } from '../lib/ban-reasons/violations-catalog'

const esc = (s: string) => s.replace(/'/g, "''")
const rows = catalogWithSortOrder()

const values = rows
  .map(
    (r) =>
      `  ('${esc(r.code)}', '${esc(r.titleVi)}', '${esc(r.titleEn)}', '${esc(r.descriptionVi || r.titleVi)}', '${esc(r.descriptionEn || r.titleEn)}', ${r.sortOrder}, true)`,
  )
  .join(',\n')

const bootstrap = `-- Tạo bảng nếu chưa chạy migration 20260525400000_short_term_and_ban.sql
CREATE TABLE IF NOT EXISTS public.ban_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  title_vi VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchased_accounts
  ADD COLUMN IF NOT EXISTS ban_reason_id UUID REFERENCES public.ban_reasons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ban_admin_note TEXT;

DROP TRIGGER IF EXISTS trg_ban_reasons_updated_at ON public.ban_reasons;
CREATE TRIGGER trg_ban_reasons_updated_at
  BEFORE UPDATE ON public.ban_reasons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.ban_reasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_ban_reasons" ON public.ban_reasons;
DROP POLICY IF EXISTS "public_all_ban_reasons" ON public.ban_reasons;
CREATE POLICY "public_read_ban_reasons" ON public.ban_reasons FOR SELECT USING (true);
CREATE POLICY "public_all_ban_reasons" ON public.ban_reasons FOR ALL USING (true);

`

const sql = `-- Danh mục mã lý do cấm Netflix (tự sinh từ lib/ban-reasons/violations-catalog.ts)
-- Chạy: npx tsx scripts/gen-ban-reasons-sql.ts để tái tạo
-- An toàn nếu chưa chạy 20260525400000_short_term_and_ban.sql (tự CREATE TABLE)

${bootstrap}
INSERT INTO public.ban_reasons (code, title_vi, title_en, description_vi, description_en, sort_order, is_active)
VALUES
${values}
ON CONFLICT (code) DO UPDATE SET
  title_vi = EXCLUDED.title_vi,
  title_en = EXCLUDED.title_en,
  description_vi = EXCLUDED.description_vi,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
`

writeFileSync('supabase/migrations/20260527100000_ban_reasons_netflix_violations.sql', sql)
console.log(`Wrote ${rows.length} ban reasons to migration file.`)
