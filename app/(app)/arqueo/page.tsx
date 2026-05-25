'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Scissors, Wallet, TrendingUp, TrendingDown, BarChart3, DollarSign, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import { toast } from 'sonner'
import MovimientoForm from '@/components/arqueo/MovimientoForm'
import CorteForm from '@/components/arqueo/CorteForm'

const TYPE_COLORS: Record<string, string> = {
  INGRESO: 'bg-success/10 text-success border-success/30',
  EGRESO: 'bg-destructive/10 text-destructive border-destructive/30',
  INVERSION: 'bg-warning/10 text-warning border-warning/30',
  RETIRO: 'bg-primary/10 text-primary border-primary/30',
}

function StatBox({ label, value, icon: Icon, color = 'text-foreground' }: { label: string; value: number; icon: any; color?: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-bold text-lg ${color}`}>${value.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default function Arqueo() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [movOpen, setMovOpen] = useState(false)
  const [corteOpen, setCorteOpen] = useState(false)
  const [tab, setTab] = useState('resumen')
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteCorteTarget, setDeleteCorteTarget] = useState<any>(null)

  const { data: movimientos = [] } = useQuery({
    queryKey: ['movimientos'],
    queryFn: async () => { const { data } = await supabase.from('movimientos').select('*').order('fecha', { ascending: false }); return data || [] },
  })

  const { data: cortes = [] } = useQuery({
    queryKey: ['cortes'],
    queryFn: async () => { const { data } = await supabase.from('cortes').select('*').order('fecha', { ascending: false }); return data || [] },
  })

  const saveMov = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('movimientos').insert(data); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['movimientos'] }); setMovOpen(false); toast.success('Movimiento registrado') },
  })

  const saveCorte = useMutation({
    mutationFn: async (data: any) => { const { error } = await supabase.from('cortes').insert(data); if (error) throw error },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cortes'] }); setCorteOpen(false); toast.success('Corte ejecutado') },
  })

  const deleteMov = useMutation({
    mutationFn: async (id: string) => { await supabase.from('movimientos').delete().eq('id', id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['movimientos'] }); setDeleteTarget(null); toast.success('Movimiento eliminado') },
  })

  const deleteCorte = useMutation({
    mutationFn: async (id: string) => { await supabase.from('cortes').delete().eq('id', id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cortes'] }); setDeleteCorteTarget(null); toast.success('Corte eliminado') },
  })

  const totals = useMemo(() => {
    const ingresos = movimientos.filter((m: any) => m.tipo === 'INGRESO').reduce((a: number, b: any) => a + (b.monto || 0), 0)
    const egresos = movimientos.filter((m: any) => m.tipo === 'EGRESO').reduce((a: number, b: any) => a + (b.monto || 0), 0)
    const inversiones = movimientos.filter((m: any) => m.tipo === 'INVERSION').reduce((a: number, b: any) => a + (b.monto || 0), 0)
    const retiros = movimientos.filter((m: any) => m.tipo === 'RETIRO').reduce((a: number, b: any) => a + (b.monto || 0), 0)
    const totalCortes = cortes.reduce((a: number, b: any) => a + (b.monto_total || 0), 0)
    const caja = ingresos - egresos - inversiones - totalCortes
    return { ingresos, egresos, inversiones, retiros, totalCortes, caja, activos: inversiones }
  }, [movimientos, cortes])

  const tabs = [{ id: 'resumen', label: 'Resumen' }, { id: 'movimientos', label: 'Movimientos' }, { id: 'cortes', label: 'Cortes' }]

  return (
    <div>
      <PageHeader title="Arqueo" description="Control de caja, activos y movimientos">
        <Button variant="outline" size="sm" onClick={() => setCorteOpen(true)}><Scissors className="w-4 h-4 mr-2" /> Corte</Button>
        <Button size="sm" onClick={() => setMovOpen(true)}><Plus className="w-4 h-4 mr-2" /> Movimiento</Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatBox label="Caja Disponible" value={totals.caja} icon={Wallet} color={totals.caja >= 0 ? 'text-success' : 'text-destructive'} />
        <StatBox label="Activos (Inversiones)" value={totals.activos} icon={TrendingUp} />
        <StatBox label="Total Ingresos" value={totals.ingresos} icon={DollarSign} color="text-success" />
        <StatBox label="Total Egresos" value={totals.egresos + totals.totalCortes} icon={TrendingDown} color="text-destructive" />
      </div>

      <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> Desglose de Caja</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Ingresos</span><span className="text-success font-medium">+${totals.ingresos.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Egresos</span><span className="text-destructive font-medium">-${totals.egresos.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Inversiones</span><span className="text-warning font-medium">-${totals.inversiones.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cortes</span><span className="text-destructive font-medium">-${totals.totalCortes.toLocaleString()}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Caja Final</span><span className={totals.caja >= 0 ? 'text-success' : 'text-destructive'}>${totals.caja.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Activos en Uso</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Inversiones registradas</span><span className="font-medium">${totals.inversiones.toLocaleString()}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Total Activos</span><span className="text-primary">${totals.activos.toLocaleString()}</span></div>
            </div>
          </div>
          {cortes.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 space-y-3 md:col-span-2">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" /> Último Corte</h3>
              {(() => { const c = cortes[0] as any; return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">Fecha</p><p className="font-medium">{c.fecha ? format(new Date(c.fecha), 'dd/MM/yyyy') : '—'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Total Corte</p><p className="font-bold text-destructive">${(c.monto_total || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Por Persona</p><p className="font-bold text-primary">${(c.monto_por_persona || 0).toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">Caja Después</p><p className="font-bold text-success">${(c.caja_despues || 0).toLocaleString()}</p></div>
                </div>
              )})()}
            </div>
          )}
        </div>
      )}

      {tab === 'movimientos' && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['Tipo','Monto','Fecha','Método','Descripción','Proveedor','Referencia',''].map(h => <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimientos.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Sin movimientos</TableCell></TableRow>
              : (movimientos as any[]).map(m => (
                <TableRow key={m.id} className="hover:bg-muted/30">
                  <TableCell><Badge className={`text-xs border ${TYPE_COLORS[m.tipo] || ''}`}>{m.tipo}</Badge></TableCell>
                  <TableCell className={`text-xs font-semibold ${m.tipo === 'INGRESO' ? 'text-success' : 'text-destructive'}`}>{m.tipo === 'INGRESO' ? '+' : '-'}${(m.monto || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{m.fecha ? format(new Date(m.fecha), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="text-xs">{m.metodo}</TableCell>
                  <TableCell className="text-xs truncate max-w-[180px]">{m.descripcion || '—'}</TableCell>
                  <TableCell className="text-xs">{m.proveedor || '—'}</TableCell>
                  <TableCell className="text-xs">{m.referencia || '—'}</TableCell>
                  <TableCell><button onClick={() => setDeleteTarget(m)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === 'cortes' && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['Fecha','Monto Total','Por Persona','Caja Antes','Caja Después','Observaciones',''].map(h => <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cortes.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Sin cortes</TableCell></TableRow>
              : (cortes as any[]).map(c => (
                <TableRow key={c.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs">{c.fecha ? format(new Date(c.fecha), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell className="text-xs font-bold text-destructive">${(c.monto_total || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-semibold text-primary">${(c.monto_por_persona || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">${(c.caja_antes || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-semibold text-success">${(c.caja_despues || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-xs truncate max-w-[180px]">{c.observaciones || '—'}</TableCell>
                  <TableCell><button onClick={() => setDeleteCorteTarget(c)} className="p-1 rounded text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MovimientoForm open={movOpen} onOpenChange={setMovOpen} onSave={d => saveMov.mutate(d)} />
      <CorteForm open={corteOpen} onOpenChange={setCorteOpen} cajaActual={totals.caja} onSave={d => saveCorte.mutate(d)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle><AlertDialogDescription>Se eliminará el movimiento <span className="font-semibold text-foreground">{deleteTarget?.tipo}</span> de <span className="font-semibold text-foreground">${deleteTarget?.monto?.toLocaleString()}</span>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMov.mutate(deleteTarget.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCorteTarget} onOpenChange={o => !o && setDeleteCorteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar corte?</AlertDialogTitle><AlertDialogDescription>Se eliminará el corte por <span className="font-semibold text-foreground">${(deleteCorteTarget?.monto_total || 0).toLocaleString()}</span>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteCorte.mutate(deleteCorteTarget.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}