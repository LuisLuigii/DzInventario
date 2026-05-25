'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2, Wand2, ClipboardPaste, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const emptyItem = {
  id_cuenta: '', correo: '', contrasena_correo: '', contrasena_epic: '',
  estado: 'Disponible', costo: '', precio_sugerido: '', descripcion: '',
  estatus: '', proveedor: '', fecha_compra: '', imagenes: [] as string[], publicada: false,
  cliente_apartado: '', precio_apartado: '',
}

const parseCredencial = (val: string) => {
  const idx = val.indexOf(':')
  if (idx === -1) return { correo: val, contrasena_correo: '' }
  return { correo: val.slice(0, idx), contrasena_correo: val.slice(idx + 1) }
}

export default function InventoryEditDialog({ open, onOpenChange, item, onSave, allItems = [] }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: any
  onSave: (data: any) => void
  allItems?: any[]
}) {
  const [form, setForm] = useState(emptyItem)
  const [credencial, setCredencial] = useState('')
  const [uploading, setUploading] = useState(false)
  const [idError, setIdError] = useState('')
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const isNew = !item?.id

  const getNextId = useCallback(() => {
    const nums = allItems.map((i: any) => parseInt(i.id_cuenta, 10)).filter((n: number) => !isNaN(n) && String(n).length === 5)
    const max = nums.length > 0 ? Math.max(...nums) : 10000
    return String(max + 1)
  }, [allItems])

  useEffect(() => {
    if (open) {
      if (item) {
        const cred = item.contrasena_correo ? `${item.correo}:${item.contrasena_correo}` : (item.correo || '')
        setCredencial(cred)
        setForm({ ...emptyItem, ...item, costo: item.costo ?? '', precio_sugerido: item.precio_sugerido ?? '', imagenes: item.imagenes || [], cliente_apartado: item.cliente_apartado || '', precio_apartado: item.precio_apartado ?? '' })
      } else {
        setCredencial('')
        setForm({ ...emptyItem, id_cuenta: getNextId() })
      }
      setIdError('')
    }
  }, [item, open])

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleCredencialChange = (val: string) => {
    setCredencial(val)
    const { correo, contrasena_correo } = parseCredencial(val)
    setForm(prev => ({ ...prev, correo, contrasena_correo }))
  }

  const validateId = (val: string) => {
    const duplicate = allItems.some((i: any) => i.id_cuenta === val && i.id !== item?.id)
    if (duplicate) { setIdError('Este ID ya existe'); return false }
    setIdError(''); return true
  }

  const handleSave = () => {
    if (!validateId(form.id_cuenta)) return
    onSave({
      ...form,
      costo: form.costo !== '' ? Number(form.costo) : 0,
      precio_sugerido: form.precio_sugerido !== '' ? Number(form.precio_sugerido) : 0,
      precio_apartado: form.estado === 'Apartada' && form.precio_apartado !== '' ? Number(form.precio_apartado) : undefined,
      cliente_apartado: form.estado === 'Apartada' ? form.cliente_apartado : '',
    })
  }

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    try {
      const supabase = createClient()
      const urls = await Promise.all(files.map(async (f) => {
        const path = `inventory/${Date.now()}-${f.name}`
        const { data, error } = await supabase.storage.from('imagenes').upload(path, f)
        if (error) throw error
        return supabase.storage.from('imagenes').getPublicUrl(data.path).data.publicUrl
      }))
      setForm(prev => ({ ...prev, imagenes: [...(prev.imagenes || []), ...urls] }))
    } catch (err: any) {
      toast.error('Error al subir imágenes: ' + (err?.message || 'Verifica el storage de Supabase'))
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'))
    await uploadFiles(files)
    e.target.value = ''
  }

  useEffect(() => {
    if (!open) return
    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter(it => it.type.startsWith('image/'))
      if (!imageItems.length) return
      e.preventDefault()
      const files = imageItems.map(it => it.getAsFile()).filter(Boolean) as File[]
      await uploadFiles(files)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [open])

  const removeImage = (idx: number) => {
    setForm(prev => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Nueva Cuenta' : 'Editar Cuenta'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">ID Cuenta *</Label>
              {isNew && (
                <button type="button" onClick={() => { set('id_cuenta', getNextId()); setIdError('') }} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                  <Wand2 className="w-3 h-3" /> Auto
                </button>
              )}
            </div>
            <Input value={form.id_cuenta} onChange={e => { set('id_cuenta', e.target.value); if (e.target.value) validateId(e.target.value) }} className={`bg-background ${idError ? 'border-destructive' : ''}`} placeholder="Ej: 10001" />
            {idError && <p className="text-xs text-destructive">{idError}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Correo:Contraseña *</Label>
            <Input value={credencial} onChange={e => handleCredencialChange(e.target.value)} className="bg-background font-mono" placeholder="correo@ejemplo.com:contraseña123" />
            <p className="text-xs text-muted-foreground">Formato: correo:contraseña</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Contraseña Epic Games</Label>
            <Input value={form.contrasena_epic} onChange={e => set('contrasena_epic', e.target.value)} className="bg-background font-mono" placeholder="Contraseña de Epic Games" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Estado</Label>
            <Select value={form.estado} onValueChange={v => set('estado', v ?? '')}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Disponible">Disponible</SelectItem>
                <SelectItem value="Apartada">Apartada</SelectItem>
                <SelectItem value="Vendida">Vendida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.estado === 'Apartada' && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
              <div className="space-y-1.5">
                <Label className="text-xs text-warning">Cliente (Discord)</Label>
                <Input value={form.cliente_apartado} onChange={e => set('cliente_apartado', e.target.value)} className="bg-background" placeholder="usuario#0000" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-warning">Precio acordado ($)</Label>
                <Input type="number" value={form.precio_apartado} onChange={e => set('precio_apartado', e.target.value)} className="bg-background" placeholder="0" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className="bg-background" rows={2} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Imágenes</Label>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><ClipboardPaste className="w-3 h-3" /> Ctrl+V para pegar</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-border bg-background hover:bg-muted/30 transition-colors text-xs text-muted-foreground">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                {uploading ? 'Subiendo...' : 'Agregar imágenes'}
              </div>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {form.imagenes && form.imagenes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-1">
                {form.imagenes.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16">
                    <img src={url} alt={`img-${i}`} className="w-16 h-16 object-cover rounded-md border border-border cursor-pointer" onClick={() => setLightboxIdx(i)} />
                    <button type="button" onClick={() => removeImage(i)} className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Fecha en que se consiguió</Label>
            <Input type="date" value={form.fecha_compra} onChange={e => set('fecha_compra', e.target.value)} className="bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Precio (Costo)</Label>
              <Input type="number" value={form.costo} onChange={e => set('costo', e.target.value)} className="bg-background" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Proveedor</Label>
              <Input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} className="bg-background" />
            </div>
          </div>
        </div>

        {lightboxIdx !== null && form.imagenes?.length > 0 && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIdx(null)}>
            <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white" onClick={e => { e.stopPropagation(); setLightboxIdx(i => ((i ?? 0) - 1 + form.imagenes.length) % form.imagenes.length) }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <img src={form.imagenes[lightboxIdx]} alt="preview" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white" onClick={e => { e.stopPropagation(); setLightboxIdx(i => ((i ?? 0) + 1) % form.imagenes.length) }}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightboxIdx(null)}><X className="w-6 h-6" /></button>
            <div className="absolute bottom-4 text-white/60 text-sm">{lightboxIdx + 1} / {form.imagenes.length}</div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.id_cuenta || !form.correo || !!idError || uploading}>
            {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Subiendo...</> : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}