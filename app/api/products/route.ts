import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { mapDbProductToApp } from '@/lib/products/map'
import { mockProducts } from '@/lib/mock-data'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ products: mockProducts.filter((p) => p.active) })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error || !data?.length) {
      return NextResponse.json({ products: mockProducts.filter((p) => p.active) })
    }

    return NextResponse.json({ products: data.map(mapDbProductToApp) })
  } catch {
    return NextResponse.json({ products: mockProducts.filter((p) => p.active) })
  }
}
