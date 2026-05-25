/**
 * migrate-images.mjs
 * 
 * Migra imágenes de Base44 → Supabase Storage
 * y actualiza las URLs en la base de datos.
 * 
 * Uso:
 *   node migrate-images.mjs
 */

import { createClient } from '@supabase/supabase-js'
import https from 'https'
import http from 'http'
import path from 'path'
import { Buffer } from 'buffer'

// ─── CONFIGURACIÓN ────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL         // https://xxxx.supabase.co
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY  // sb_secret_...
const BUCKET = 'imagenes'
// ──────────────────────────────────────────────────────────────────

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno: SUPABASE_URL y SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Descarga una URL y retorna el buffer
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} para ${url}`))
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'image/jpeg'
      }))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// Sube imagen a Supabase Storage y retorna la URL pública
async function uploadToSupabase(url, folder) {
  // Si ya es una URL de Supabase, no migrar
  if (url.includes('supabase')) return url

  try {
    const { buffer, contentType } = await downloadImage(url)
    
    // Generar nombre de archivo único basado en la URL original
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg'
    const hash = url.split('/').pop().split('?')[0] || Date.now().toString()
    const filename = `${folder}/${hash}.${ext}`

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType,
        upsert: true // Si ya existe, reemplazar
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (err) {
    console.warn(`  ⚠️  No se pudo migrar ${url.substring(0, 60)}...: ${err.message}`)
    return url // Retorna la URL original si falla
  }
}

// Parsea el campo imagenes que viene como string JSON de Base44
function parseImageArray(val) {
  if (!val || val === '[]' || val === '') return []
  if (Array.isArray(val)) return val
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ─── MIGRAR INVENTORY ─────────────────────────────────────────────
async function migrateInventory() {
  console.log('\n📦 Migrando imágenes de Inventory...')
  
  const { data: items, error } = await supabase
    .from('inventory')
    .select('id, id_cuenta, imagenes')

  if (error) { console.error('Error:', error); return }

  let migrated = 0
  for (const item of items) {
    const urls = parseImageArray(item.imagenes)
    const base44Urls = urls.filter(u => u && u.includes('base44'))
    
    if (base44Urls.length === 0) continue

    console.log(`  Cuenta ${item.id_cuenta}: ${base44Urls.length} imágenes`)
    
    const newUrls = await Promise.all(
      urls.map(url => url.includes('base44') 
        ? uploadToSupabase(url, `inventory/${item.id_cuenta}`)
        : Promise.resolve(url)
      )
    )

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ imagenes: newUrls })
      .eq('id', item.id)

    if (updateError) {
      console.error(`  ❌ Error actualizando ${item.id_cuenta}:`, updateError)
    } else {
      migrated++
      console.log(`  ✅ ${item.id_cuenta} migrado`)
    }
  }

  console.log(`✅ Inventory: ${migrated} cuentas con imágenes migradas`)
}

// ─── MIGRAR SALES (receipt_images) ────────────────────────────────
async function migrateSales() {
  console.log('\n🧾 Migrando comprobantes de Sales...')

  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, id_cuenta, receipt_images')

  if (error) { console.error('Error:', error); return }

  let migrated = 0
  for (const sale of sales) {
    const urls = parseImageArray(sale.receipt_images)
    const base44Urls = urls.filter(u => u && u.includes('base44'))

    if (base44Urls.length === 0) continue

    console.log(`  Venta ${sale.id_cuenta}: ${base44Urls.length} comprobantes`)

    const newUrls = await Promise.all(
      urls.map(url => url.includes('base44')
        ? uploadToSupabase(url, `receipts/${sale.id_cuenta}`)
        : Promise.resolve(url)
      )
    )

    const { error: updateError } = await supabase
      .from('sales')
      .update({ receipt_images: newUrls })
      .eq('id', sale.id)

    if (updateError) {
      console.error(`  ❌ Error actualizando venta ${sale.id_cuenta}:`, updateError)
    } else {
      migrated++
      console.log(`  ✅ Venta ${sale.id_cuenta} migrada`)
    }
  }

  console.log(`✅ Sales: ${migrated} ventas con comprobantes migrados`)
}

// ─── MAIN ──────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando migración de imágenes Base44 → Supabase Storage')
  console.log(`   URL: ${SUPABASE_URL}`)
  console.log(`   Bucket: ${BUCKET}`)

  // Verificar que el bucket existe
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET)
  if (!bucketExists) {
    console.error(`❌ El bucket "${BUCKET}" no existe. Créalo en Supabase Storage primero.`)
    process.exit(1)
  }

  await migrateInventory()
  await migrateSales()

  console.log('\n🎉 Migración completada!')
  console.log('   Las URLs en la base de datos ahora apuntan a Supabase Storage.')
}

main().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
