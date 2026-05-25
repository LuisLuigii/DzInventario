'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function CorteForm({ open, onOpenChange, cajaActual, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  cajaActual: number
  onSave: (data: any) => void
}) {
  const [monto, setMonto] = useState('')
  const [obs, setObs] = useState('')

  const montoNum = Number(monto) || 0
  const porPersona = montoNum / 3
  const cajaFinal = cajaActual - montoNum

  const handleSave = () => {
    onSave({
      fecha: new Date().toISOString().split('T')[0],
      monto_total: montoNum,
      monto_por_persona: porPersona,
      caja_antes: cajaActual,
      caja_despues: cajaFinal,
      observaciones: obs,
    })
    setMonto('')
    setObs('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader><DialogTitle>Ejecutar Corte</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
            <p><span className="text-muted-foreground">Caja actual:</span> <span className="font-bold text-foreground">${cajaActual.toLocaleString()}</span></p>
            {monto && <p><span className="text-muted-foreground">Por persona (3):</span> <span className="font-semibold text-primary">${porPersona.toLocaleString()}</span></p>}
            {monto && <p><span className="text-muted-foreground">Caja final:</span> <span className={`font-bold ${cajaFinal < 0 ? 'text-destructive' : 'text-success'}`}>${cajaFinal.toLocaleString()}</span></p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Monto del Corte</Label>
            <Input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="bg-background" placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Observaciones</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} className="bg-background" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!monto || cajaFinal < 0}>Confirmar Corte</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}