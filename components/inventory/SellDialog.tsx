'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2, ClipboardPaste, Copy, Check } from 'lucide-react'
import { addMonths, format } from 'date-fns'
import { toast } from 'sonner'

const computeWarranty = (precio: string) => {
  const p = Number(precio)
  const fechaVenta = new Date()
  if (!p || p < 3000) return { tipo: '1 mes', fechaFin: format(addMonths(fechaVenta, 1), 'yyyy-MM-dd') }
  return { tipo: 'De por vida', fechaFin: '' }
}

export default function SellDialog({ open, onOpenChange, item, onSell }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: any
  onSell: (data: any) => void
}) {
  const [form, setForm] = useState({ cliente_discord: '', precio_venta: '', observaciones: '', metodo: 'Transferencia', canal: 'Discord', tipo_garantia: '1 mes', fecha_vencimiento_garantia: '' })
  const [images, setImages] = useState<string[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [showCopy, setShowCopy] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) {
      const { tipo, fechaFin } = computeWarranty('')
      setForm({ cliente_discord: '', precio_venta: '', observaciones: '', metodo: 'Transferencia', canal: 'Discord', tipo_garantia: tipo, fecha_vencimiento_garantia: fechaFin })
      setImages([]); setUploadedUrls([]); setShowCopy(false); setCopied(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter(it => it.type.startsWith('image/'))
      if (!imageItems.length) return
      e.preventDefault()
      setUploading(true)
      const supabase = createClient()
      const files = imageItems.map(it => it.getAsFile()).filter(Boolean) as File[]
      const newUrls: string[] = []
      for (const file of files) {
        const path = `receipts/${Date.now()}-${file.name}`
        const { data, error } = await supabase.storage.from('imagenes').upload(path, file)
        if (!error && data) {
          const url = supabase.storage.from('imagenes').getPublicUrl(data.path).data.publicUrl
          newUrls.push(url)
          setImages(prev => [...prev, URL.createObjectURL(file)])
        }
      }
      setUploadedUrls(prev => [...prev, ...newUrls])
      setUploading(false)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open])

  const ganancia = form.precio_venta ? Number(form.precio_venta) - (item?.costo || 0) : 0

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    const newUrls: string[] = []
    for (const file of files) {
      const path = `receipts/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('imagenes').upload(path, file)
      if (!error && data) {
        const url = supabase.storage.from('imagenes').getPublicUrl(data.path).data.publicUrl
        newUrls.push(url)
        setImages(prev => [...prev, URL.createObjectURL(file)])
      }
    }
    setUploadedUrls(prev => [...prev, ...newUrls])
    setUploading(false)
  }

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx))
    setUploadedUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const buildCopyText = () => {
    const sep = '╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍'
    return `${sep}\nEPIC GAMES\n${sep}\n${item?.correo || ''}\n${item?.contrasena_epic || ''}\n${sep}\nAl terminar el mes de garantia se te entrega el full access de la cuenta, esperamos tu referencia amigo https://discord.com/channels/1419142324541456528/1419161169633087548\n${sep}`
  }

  const handleSell = () => {
    const data = {
      id_cuenta: item.id_cuenta,
      cliente_discord: form.cliente_discord,
      precio_venta: Number(form.precio_venta),
      costo: item.costo || 0,
      ganancia,
      fecha_venta: new Date().toISOString().split('T')[0],
      fecha_vencimiento_garantia: form.tipo_garantia === '1 mes' ? form.fecha_vencimiento_garantia : '',
      tipo_garantia: form.tipo_garantia,
      estado_garantia: 'Activa',
      fa_entregado: false,
      observaciones: form.observaciones,
      receipt_images: uploadedUrls,
      seller: item.seller,
      metodo_pago: form.metodo,
      canal_venta: form.canal,
    }
    onSell(data)
    setShowCopy(true)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader><DialogTitle>Registrar Venta</DialogTitle></DialogHeader>

        {showCopy ? (
          <div className="space-y-4">
            <p className="text-sm text-success font-semibold">✓ Venta registrada exitosamente</p>
            <div className="bg-muted/60 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap text-foreground border border-border leading-relaxed">{buildCopyText()}</div>
            <Button className="w-full" onClick={() => { navigator.clipboard.writeText(buildCopyText()).then(() => { setCopied(true); toast.success('Copiado'); setTimeout(() => setCopied(false), 2000) }) }} variant={copied ? 'secondary' : 'default'}>
              {copied ? <><Check className="w-4 h-4 mr-2" />Copiado</> : <><Copy className="w-4 h-4 mr-2" />Copiar mensaje</>}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Cuenta:</span> {item?.id_cuenta}</p>
                <p><span className="text-muted-foreground">Costo:</span> ${item?.costo || 0}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cliente Discord</Label>
                <Input value={form.cliente_discord} onChange={e => setForm(p => ({ ...p, cliente_discord: e.target.value }))} className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Método de Pago</Label>
                  <Select value={form.metodo} onValueChange={v => setForm(p => ({ ...p, metodo: v ?? '' }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{['Efectivo','Transferencia','Crypto'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Canal de Venta</Label>
                  <Select value={form.canal} onValueChange={v => setForm(p => ({ ...p, canal: v ?? '' }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{['Discord','Telegram','WhatsApp','Otro'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Precio de Venta</Label>
                <Input type="number" value={form.precio_venta} onChange={e => {
                  const val = e.target.value
                  const { tipo, fechaFin } = computeWarranty(val)
                  setForm(p => ({ ...p, precio_venta: val, tipo_garantia: tipo, fecha_vencimiento_garantia: fechaFin }))
                }} className="bg-background" />
              </div>
              {form.precio_venta && (
                <div className={`text-sm font-semibold ${ganancia >= 0 ? 'text-success' : 'text-destructive'}`}>Ganancia: ${ganancia.toFixed(2)}</div>
              )}
              <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Tipo de garantía:</span> <span className="font-semibold">{form.tipo_garantia}</span></p>
                {form.tipo_garantia === '1 mes' && form.fecha_vencimiento_garantia && (
                  <p><span className="text-muted-foreground">Vence:</span> <span className="font-semibold">{form.fecha_vencimiento_garantia}</span></p>
                )}
                {form.tipo_garantia === 'De por vida' && <p className="text-success font-semibold">Garantía de por vida</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Observaciones</Label>
                <Textarea value={form.observaciones} onChange={e => setForm(p => ({ ...p, observaciones: e.target.value }))} className="bg-background" rows={2} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Comprobantes de Pago</Label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><ClipboardPaste className="w-3 h-3" /> Ctrl+V para pegar</span>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <ImagePlus className="w-4 h-4 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">{uploading ? 'Subiendo...' : 'Agregar imágenes'}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" disabled={uploading} />
                </label>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {images.map((src, idx) => (
                      <div key={idx} className="relative">
                        <img src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-border" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"><X className="w-2.5 h-2.5 text-white" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSell} disabled={!form.precio_venta || uploading}>Confirmar Venta</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}