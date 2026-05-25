'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const empty = { tipo: 'INGRESO', monto: '', fecha: new Date().toISOString().split('T')[0], metodo: 'Efectivo', descripcion: '', proveedor: '', referencia: '' }

export default function MovimientoForm({ open, onOpenChange, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSave: (data: any) => void
}) {
  const [form, setForm] = useState(empty)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = () => {
    onSave({ ...form, monto: Number(form.monto) })
    setForm(empty)
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setForm(empty) }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Nuevo Movimiento</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo *</Label>
            <Select value={form.tipo} onValueChange={v => set('tipo', v ?? '')}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['INGRESO','EGRESO','INVERSION','RETIRO'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto *</Label>
            <Input type="number" value={form.monto} onChange={e => set('monto', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fecha *</Label>
            <Input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Método *</Label>
            <Select value={form.metodo} onValueChange={v => set('metodo', v ?? '')}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Efectivo','Transferencia','Crypto'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Proveedor</Label>
            <Input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Referencia</Label>
            <Input value={form.referencia} onChange={e => set('referencia', e.target.value)} className="bg-background" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} className="bg-background" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.monto || !form.fecha}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}