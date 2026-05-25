'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export default function PullImportDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const queryClient = useQueryClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setDone(false)
    try {
      let records: any[] = []
      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        records = Papa.parse(text, { header: true, skipEmptyLines: true }).data as any[]
      } else {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer)
        records = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      }

      const mapped = records.map((r: any) => ({
        id_cuenta: String(r.id_cuenta || ''),
        tipo_cuenta: String(r.tipo_cuenta || ''),
        fresh_colocado: String(r.fresh_colocado || ''),
        fecha_inicial: r.fecha_inicial || null,
        fecha_final: r.fecha_final || null,
        rechazada: String(r.rechazada || ''),
        descripcion_cuenta: String(r.descripcion_cuenta || ''),
        mail_pulleado: String(r.mail_pulleado || ''),
        email_bomb_estado: String(r.email_bomb_estado || ''),
        telegram: String(r.telegram || ''),
        status_marker: 'none',
        seller: r.seller || 'Deynzo',
      })).filter(r => r.id_cuenta)

      const supabase = createClient()
      const { error } = await supabase.from('pulls').insert(mapped)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['pulls'] })
      setDone(true)
      toast.success(`${mapped.length} pulls importados`)
    } catch (err: any) {
      toast.error('Error al importar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setDone(false) }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Importar Pulls</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Sube un CSV/Excel con columnas: <span className="font-mono text-xs">id_cuenta, tipo_cuenta, fresh_colocado, fecha_inicial, fecha_final, rechazada, descripcion_cuenta, mail_pulleado, email_bomb_estado, telegram</span></p>
          {done ? (
            <div className="flex items-center gap-2 text-success text-sm"><CheckCircle className="w-4 h-4" /> Importación completada</div>
          ) : (
            <div className="flex items-center gap-3">
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={loading} className="bg-background" />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}