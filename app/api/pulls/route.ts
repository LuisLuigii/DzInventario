import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const apiSecret = process.env.DZPULLS_API_SECRET
  const authHeader = request.headers.get('Authorization')

  if (!apiSecret || authHeader !== `Bearer ${apiSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id_cuenta, tipo_cuenta, fresh_colocado, mail_pulleado, seller, fecha_inicial, fecha_final } = body

  if (!id_cuenta || !seller) {
    return NextResponse.json({ error: 'id_cuenta y seller son requeridos' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data, error } = await supabase.from('pulls').insert({
    id_cuenta,
    tipo_cuenta: tipo_cuenta || '',
    fresh_colocado: fresh_colocado || '',
    mail_pulleado: mail_pulleado || '',
    seller,
    fecha_inicial: fecha_inicial || new Date().toISOString().split('T')[0],
    fecha_final: fecha_final || null,
    status_marker: 'none',
    rechazada: '',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}