import { NextResponse } from 'next/server'
import { createServiceRoleClient, hasSupabaseServiceRole } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/admin/verify-admin'
import { isSupabaseConfigured } from '@/lib/auth/login'
import { mapDbProductToApp } from '@/lib/products/map'
import {
  removeProductImageFromStorage,
  uploadProductImage,
} from '@/lib/products/image-storage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params
    const adminUserId = request.headers.get('x-admin-user-id')
    await requireAdminUser(adminUserId, request)

    if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
      return NextResponse.json({ error: 'Supabase service role required' }, { status: 503 })
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()
    const { data: existing, error: findErr } = await supabase
      .from('products')
      .select('id, image_storage_path')
      .eq('id', productId)
      .maybeSingle()

    if (findErr) throw findErr
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (existing.image_storage_path) {
      await removeProductImageFromStorage(existing.image_storage_path)
    }

    const { path, publicUrl } = await uploadProductImage(productId, file)
    const image_updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('products')
      .update({
        image_url: publicUrl.split('?')[0],
        image_storage_path: path,
        image_updated_at,
      })
      .eq('id', productId)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ product: mapDbProductToApp(data) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status =
      msg === 'Unauthorized' || msg === 'Forbidden'
        ? 403
        : msg.includes('Chỉ chấp nhận') || msg.includes('tối đa')
          ? 400
          : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params
    const adminUserId =
      request.headers.get('x-admin-user-id') ||
      new URL(request.url).searchParams.get('adminUserId')
    await requireAdminUser(adminUserId, request)

    if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
      return NextResponse.json({ error: 'Supabase service role required' }, { status: 503 })
    }

    const supabase = createServiceRoleClient()
    const { data: row, error: findErr } = await supabase
      .from('products')
      .select('image_storage_path')
      .eq('id', productId)
      .maybeSingle()

    if (findErr) throw findErr
    if (!row) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await removeProductImageFromStorage(row.image_storage_path)

    const { data, error } = await supabase
      .from('products')
      .update({
        image_url: null,
        image_storage_path: null,
        image_updated_at: null,
      })
      .eq('id', productId)
      .select('*')
      .single()

    if (error) throw error

    return NextResponse.json({ product: mapDbProductToApp(data) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error'
    const status = msg === 'Unauthorized' || msg === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
