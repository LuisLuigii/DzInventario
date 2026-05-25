'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function AbonosModal({ item, open, onOpenChange }: {
  item: any
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [monto, setMonto] = useState('')
  const [obs, setObs] = useState('')
  const supabase = createClient()

  const { data: abonos = [] } = useQuery({
    queryKey: ['abonos', item?.id_cuenta],
    queryFn: async () => {
      const { data } = await supabase.from('abonos').select('*').eq('id_cuenta', item.id_cuenta).order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!item?.id_cuenta && open,
  })

  const totalAbonado = abonos.reduce((sum: number, a: any) => sum + (a.monto || 0), 0)
  const deudaTotal = item?.precio_apartado || 0
  const deudaRestante = Math.max(0, deudaTotal - totalAbonado)

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('abonos').insert({
        id_cuenta: item.id_cuenta,
        cliente_discord: item.cliente_apartado || '',
        monto: Number(monto),
        deuda_total: deudaTotal,
        fecha: new Date().toISOString().split('T')[0],
        observaciones: obs,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abonos', item?.id_cuenta] })
      setMonto('')
      setObs('')
      toast.success('Abono registrado')
    },
  })

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Abonos — Cuenta {item.id_cuenta}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Precio acordado</p>
              <p className="text-sm font-bold text-foreground">${deudaTotal}</p>
            </div>
            <div className="bg-success/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total abonado</p>
              <p className="text-sm font-bold text-success">${totalAbonado}</p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Deuda restante</p>
              <p className="text-sm font-bold text-destructive">${deudaRestante}</p>
            </div>
          </div>

          {item.cliente_apartado && (
            <p className="text-xs text-muted-foreground">Cliente: <span className="text-foreground font-semibold">{item.cliente_apartado}</span></p>
          )}

          {abonos.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial</p>
              {abonos.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between bg-muted/30 rounded-md px-3 py-2 text-xs">
                  <div>
                    <span className="font-semibold text-success">+${a.monto}</span>
                    {a.observaciones && <span className="text-muted-foreground ml-2">{a.observaciones}</span>}
                  </div>
                  <span className="text-muted-foreground">{a.fecha ? format(new Date(a.fecha), 'dd/MM/yy') : ''}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registrar abono</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Monto ($)</Label>
                <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="bg-background" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nota (opcional)</Label>
                <Input value={obs} onChange={e => setObs(e.target.value)} className="bg-background" placeholder="Transferencia..." />
              </div>
            </div>
            <Button className="w-full" disabled={!monto || Number(monto) <= 0 || addMutation.isPending} onClick={() => addMutation.mutate()}>
              <Plus className="w-4 h-4 mr-2" /> Registrar abono
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}