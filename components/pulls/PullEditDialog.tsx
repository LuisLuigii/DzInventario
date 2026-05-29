'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const emptyPull = {
  id_cuenta: '', tipo_cuenta: '', fresh_colocado: '', fecha_inicial: '',
  fecha_final: '', rechazada: '', descripcion_cuenta: '', status_marker: 'none',
  mail_pulleado: '', seller: '',
}

export default function PullEditDialog({ open, onOpenChange, item, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: any
  onSave: (data: any) => void
}) {
  const [form, setForm] = useState(emptyPull)

  useEffect(() => {
    if (item) {
      const rechazada = typeof item.rechazada === 'boolean' ? (item.rechazada ? 'Rechazada' : '') : (item.rechazada || '')
      setForm({ ...emptyPull, ...item, rechazada })
    } else {
      setForm(emptyPull)
    }
  }, [item, open])

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle>{item?.id ? 'Editar Pull' : 'Nuevo Pull'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">ID Cuenta *</Label>
            <Input value={form.id_cuenta} onChange={e => set('id_cuenta', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Seller *</Label>
            <Select value={form.seller || ''} onValueChange={v => set('seller', v ?? '')}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {['Deynzo','Zana','Luigii'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo Cuenta</Label>
            <Input value={form.tipo_cuenta} onChange={e => set('tipo_cuenta', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fresh / Colocado</Label>
            <Input value={form.fresh_colocado} onChange={e => set('fresh_colocado', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fecha Inicial</Label>
            <Input type="date" value={form.fecha_inicial} onChange={e => set('fecha_inicial', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Fecha Final</Label>
            <Input type="date" value={form.fecha_final} onChange={e => set('fecha_final', e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Estado Rechazo</Label>
            <Select value={form.rechazada || 'ninguno'} onValueChange={v => set('rechazada', (v ?? '') === 'ninguno' ? '' : (v ?? ''))}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Ninguno" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Ninguno</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
                <SelectItem value="Apelando">Apelando</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Marcador Visual</Label>
            <Select value={form.status_marker || 'none'} onValueChange={v => set('status_marker', v ?? '')}>
              <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin color</SelectItem>
                <SelectItem value="green">🟢 Verde</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mail Pulleado</Label>
            <Input value={form.mail_pulleado} onChange={e => set('mail_pulleado', e.target.value)} className="bg-background" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Descripción Cuenta</Label>
            <Textarea value={form.descripcion_cuenta} onChange={e => set('descripcion_cuenta', e.target.value)} className="bg-background" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(form)} disabled={!form.id_cuenta || !form.seller}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}