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

export default function ImportDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const queryClient = useQueryClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setDone(false)

    try {
      let records: any[] = []

      if (file.name.endsWith('.csv')) {
        const text = await file.text()
        const result = Papa.parse(text, { header: true, skipEmptyLines: true })
        records = result.data as any[]
      } else {
        const buffer = await file.arrayBuffer()
        const wb = XLSX.read(buffer)
        const ws = wb.Sheets[wb.SheetNames[0]]
        records = XLSX.utils.sheet_to_json(ws)
      }

      const mapped = records.map((r: any) => ({
        id_cuenta: String(r.id_cuenta || ''),
        correo: String(r.correo || ''),
        contrasena_correo: String(r.contrasena_correo || ''),
        contrasena_epic: String(r.contrasena_epic || ''),
        estado: r.estado || 'Disponible',
        costo: Number(r.costo) || 0,
        precio_sugerido: Number(r.precio_sugerido) || 0,
        descripcion: String(r.descripcion || ''),
        estatus: String(r.estatus || ''),
        proveedor: String(r.proveedor || ''),
        fecha_compra: r.fecha_compra || null,
      })).filter(r => r.id_cuenta && r.correo)

      const supabase = createClient()
      const { error } = await supabase.from('inventory').insert(mapped)
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      setDone(true)
      toast.success(`${mapped.length} cuentas importadas`)
    } catch (err: any) {
      toast.error('Error al importar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) setDone(false) }}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader><DialogTitle>Importar Inventario</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Sube un CSV o Excel con columnas: id_cuenta, correo, contrasena_correo, contrasena_epic, estado, costo, precio_sugerido, descripcion, proveedor, fecha_compra</p>
          {done ? (
            <div className="flex items-center gap-2 text-success text-sm"><CheckCircle className="w-4 h-4" /> Importación completada</div>
          ) : (
            <div className="flex items-center gap-3">
              <Input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={loading} className="bg-background" />
              {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}