'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/shared/PageHeader'
import Pagination from '@/components/shared/Pagination'
import useCurrentUser from '@/lib/useCurrentUser'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DollarSign, TrendingUp, Upload, Trash2, Undo2, ShieldOff, Search } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { EvidenceButton } from '@/components/sales/EvidenceModal'
import { ImageGalleryButton } from '@/components/shared/ImageGalleryButton'
import { format } from 'date-fns'
import SaleImportDialog from '@/components/sales/SaleImportDialog'

const PAGE_SIZE = 100

export default function Sales() {
  const { isAdmin, sellerName } = useCurrentUser()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [returnTarget, setReturnTarget] = useState<any>(null)
  const [cancelGarantiaTarget, setCancelGarantiaTarget] = useState<any>(null)
  const [descTarget, setDescTarget] = useState<any>(null)

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => { const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false }); return data || [] },
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => { const { data } = await supabase.from('inventory').select('*'); return data || [] },
  })

  const inventoryMap = useMemo(() => {
    const map: Record<string, any> = {}
    ;(inventory as any[]).forEach(i => { map[i.id_cuenta] = i })
    return map
  }, [inventory])

  const filtered = useMemo(() => {
    let list = isAdmin ? sales as any[] : (sales as any[]).filter(s => s.seller === sellerName)
    if (dateFrom) list = list.filter(s => s.fecha_venta >= dateFrom)
    if (dateTo) list = list.filter(s => s.fecha_venta <= dateTo)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(s => (s.id_cuenta || '').toLowerCase().includes(q) || (s.cliente_discord || '').toLowerCase().includes(q) || (s.seller || '').toLowerCase().includes(q))
    }
    return list
  }, [sales, dateFrom, dateTo, search, isAdmin, sellerName])

  const totalRevenue = filtered.reduce((a: number, b: any) => a + (b.precio_venta || 0), 0)
  const totalProfit = filtered.reduce((a: number, b: any) => a + (b.ganancia || 0), 0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('sales').delete().eq('id', id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); setDeleteTarget(null); toast.success('Venta eliminada') },
  })

  const cancelGarantiaMutation = useMutation({
    mutationFn: async (sale: any) => { await supabase.from('sales').update({ estado_garantia: 'Cancelada' }).eq('id', sale.id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); setCancelGarantiaTarget(null); toast.success('Garantía cancelada') },
  })

  const toggleFAMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => { await supabase.from('sales').update({ fa_entregado: value }).eq('id', id) },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  })

  const returnMutation = useMutation({
    mutationFn: async (sale: any) => {
      await supabase.from('sales').update({ devuelta: true }).eq('id', sale.id)
      const invItem = inventoryMap[sale.id_cuenta]
      if (invItem) await supabase.from('inventory').update({ estado: 'Disponible' }).eq('id', invItem.id)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales'] }); queryClient.invalidateQueries({ queryKey: ['inventory'] }); setReturnTarget(null); toast.success('Cuenta devuelta al inventario') },
  })

  return (
    <div>
      <PageHeader title="Ventas" description={`${filtered.length} ventas registradas`}>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="w-4 h-4 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Ingresos</p><p className="font-bold text-lg">${totalRevenue.toLocaleString()}</p></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-success" /></div>
          <div><p className="text-xs text-muted-foreground">Ganancia</p><p className="font-bold text-lg">${totalProfit.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-8 w-64 bg-card border-border" placeholder="Buscar..." />
        </div>
        <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="w-40 bg-card border-border" />
        <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="w-40 bg-card border-border" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['ID Cuenta','Cliente','Precio','Costo','Ganancia','Fecha','Observaciones','Garantía','Estado','Vence','FA','Imgs.','Evidencia','Devuelta',...(isAdmin ? ['','',''] : [])].map((h, i) => <TableHead key={i} className="text-xs font-semibold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? <TableRow><TableCell colSpan={isAdmin ? 17 : 14} className="text-center text-muted-foreground py-12">Sin ventas</TableCell></TableRow>
              : paginated.map((sale: any) => {
                const today = new Date().toISOString().split('T')[0]
                const expired = sale.fecha_vencimiento_garantia && today > sale.fecha_vencimiento_garantia
                return (
                  <TableRow key={sale.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{sale.id_cuenta}</TableCell>
                    <TableCell className="text-xs">{sale.cliente_discord || '—'}</TableCell>
                    <TableCell className="text-xs font-medium">${sale.precio_venta || 0}</TableCell>
                    <TableCell className="text-xs">${sale.costo || 0}</TableCell>
                    <TableCell className={`text-xs font-semibold ${(sale.ganancia || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>${sale.ganancia || 0}</TableCell>
                    <TableCell className="text-xs">{sale.fecha_venta ? format(new Date(sale.fecha_venta), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      {sale.observaciones ? <button onClick={() => setDescTarget(sale)} className="text-left truncate max-w-[180px] block hover:text-primary hover:underline">{sale.observaciones}</button> : '—'}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{sale.tipo_garantia || '—'}</TableCell>
                    <TableCell>
                      {sale.estado_garantia === 'Cancelada' ? <Badge className="bg-destructive/10 text-destructive border-destructive/30 text-xs">Cancelada</Badge>
                      : sale.tipo_garantia === 'De por vida' ? <Badge className="bg-success/10 text-success border-success/30 text-xs">Activa</Badge>
                      : expired || sale.estado_garantia === 'Expirada' ? <Badge className="bg-muted text-muted-foreground text-xs">Expirada</Badge>
                      : <Badge className="bg-success/10 text-success border-success/30 text-xs">Activa</Badge>}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{sale.tipo_garantia === '1 mes' && sale.fecha_vencimiento_garantia ? format(new Date(sale.fecha_vencimiento_garantia), 'dd/MM/yy') : '—'}</TableCell>
                    <TableCell><Checkbox checked={!!sale.fa_entregado} onCheckedChange={v => toggleFAMutation.mutate({ id: sale.id, value: v as boolean })} /></TableCell>
                    <TableCell><ImageGalleryButton images={inventoryMap[sale.id_cuenta]?.imagenes} label="Imágenes de Cuenta" /></TableCell>
                    <TableCell><EvidenceButton images={sale.receipt_images} /></TableCell>
                    <TableCell className="text-xs">{sale.devuelta ? <span className="text-destructive font-semibold">Sí</span> : <span className="text-muted-foreground">No</span>}</TableCell>
                    {isAdmin && <TableCell>{sale.estado_garantia !== 'Cancelada' && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => setCancelGarantiaTarget(sale)}><ShieldOff className="w-3.5 h-3.5" /></Button>}</TableCell>}
                    {isAdmin && <TableCell>{!sale.devuelta && <Button variant="ghost" size="icon" className="h-7 w-7 text-warning hover:text-warning" onClick={() => setReturnTarget(sale)}><Undo2 className="w-3.5 h-3.5" /></Button>}</TableCell>}
                    {isAdmin && <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => setDeleteTarget(sale)}><Trash2 className="w-3.5 h-3.5" /></Button></TableCell>}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <SaleImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <Dialog open={!!descTarget} onOpenChange={o => !o && setDescTarget(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle>Observaciones — {descTarget?.id_cuenta}</DialogTitle></DialogHeader>
          <p className="text-sm whitespace-pre-wrap">{descTarget?.observaciones}</p>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!cancelGarantiaTarget} onOpenChange={o => !o && setCancelGarantiaTarget(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>¿Cancelar garantía?</AlertDialogTitle><AlertDialogDescription>Se cancelará la garantía de la cuenta <span className="font-mono font-semibold text-foreground">{cancelGarantiaTarget?.id_cuenta}</span>.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => cancelGarantiaMutation.mutate(cancelGarantiaTarget)}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!returnTarget} onOpenChange={o => !o && setReturnTarget(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>¿Devolver cuenta?</AlertDialogTitle><AlertDialogDescription>La cuenta <span className="font-mono font-semibold text-foreground">{returnTarget?.id_cuenta}</span> regresará a Inventario como Disponible.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-warning hover:bg-warning/90" onClick={() => returnMutation.mutate(returnTarget)}>Confirmar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteTarget.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  )
}