'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import PageHeader from '@/components/shared/PageHeader'
import Pagination from '@/components/shared/Pagination'
import PullEditDialog from '@/components/pulls/PullEditDialog'
import PullImportDialog from '@/components/pulls/PullImportDialog'
import useCurrentUser from '@/lib/useCurrentUser'
import { toast } from 'sonner'
import { format } from 'date-fns'

const PAGE_SIZE = 100
const rechazadaConfig: Record<string, string> = {
  Rechazada: 'bg-destructive/10 text-destructive border-destructive/30',
  Apelando: 'bg-warning/10 text-warning border-warning/30',
}

export default function Pulls() {
  const { isAdmin, sellerName } = useCurrentUser()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [sellerFilter, setSellerFilter] = useState<string | null>('all')
  const [page, setPage] = useState(1)
  const [editItem, setEditItem] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const { data: pulls = [], isLoading } = useQuery({
    queryKey: ['pulls'],
    queryFn: async () => { const { data } = await supabase.from('pulls').select('*').order('created_at', { ascending: false }); return data || [] },
  })

  const filtered = useMemo(() => {
    let list = isAdmin ? pulls as any[] : (pulls as any[]).filter(p => p.seller === sellerName)
    if (sellerFilter && sellerFilter !== 'all') list = list.filter(p => p.seller === sellerFilter)
    return list
  }, [pulls, sellerFilter, isAdmin, sellerName])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) { const { id, ...rest } = data; await supabase.from('pulls').update(rest).eq('id', id) }
      else { await supabase.from('pulls').insert(data) }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pulls'] }); setEditOpen(false); toast.success('Pull guardado') },
  })

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => { await supabase.from('pulls').delete().eq('id', item.id) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pulls'] }); setDeleteTarget(null); toast.success('Pull eliminado') },
  })

  return (
    <div>
      <PageHeader title="Pulls" description={`${filtered.length} pulls`}>
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4 mr-2" /> Importar</Button>
        <Button size="sm" onClick={() => { setEditItem(null); setEditOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nuevo Pull</Button>
      </PageHeader>

      {isAdmin && (
        <div className="flex gap-3 mb-4">
          <Select value={sellerFilter ?? 'all'} onValueChange={v => { setSellerFilter(v); setPage(1) }}>
            <SelectTrigger className="w-36 bg-card border-border"><SelectValue placeholder="Seller" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {['Deynzo','Zana','Luigii'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['','ID Cuenta','Tipo','Fresh/Colocado','Fecha Inicial','Fecha Final','Estado','Descripción','Mail Pulleado','Seller','Acciones'].map(h => <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-12">Sin pulls</TableCell></TableRow>
              : paginated.map((pull: any) => {
                const rechazadaVal = typeof pull.rechazada === 'boolean' ? (pull.rechazada ? 'Rechazada' : '') : (pull.rechazada || '')
                return (
                  <TableRow key={pull.id} className="hover:bg-muted/30">
                    <TableCell className="w-6 px-2">{pull.status_marker === 'green' && <span className="inline-block w-2.5 h-2.5 rounded-full bg-success" />}</TableCell>
                    <TableCell className="font-mono text-xs">{pull.id_cuenta}</TableCell>
                    <TableCell className="text-xs">{pull.tipo_cuenta || '—'}</TableCell>
                    <TableCell className="text-xs">{pull.fresh_colocado || '—'}</TableCell>
                    <TableCell className="text-xs">{pull.fecha_inicial ? format(new Date(pull.fecha_inicial), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell className="text-xs">{pull.fecha_final ? format(new Date(pull.fecha_final), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>{rechazadaVal ? <Badge className={`text-[10px] border ${rechazadaConfig[rechazadaVal] || ''}`}>{rechazadaVal}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-xs truncate max-w-[140px]">{pull.descripcion_cuenta || '—'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{pull.mail_pulleado || '—'}</TableCell>
                    <TableCell className="text-xs">{pull.seller}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(pull); setEditOpen(true) }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => setDeleteTarget(pull)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <PullEditDialog open={editOpen} onOpenChange={setEditOpen} item={editItem} onSave={data => saveMutation.mutate(editItem ? { ...data, id: editItem.id } : data)} />
      <PullImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar pull?</AlertDialogTitle><AlertDialogDescription>Se eliminará permanentemente el pull <span className="font-mono font-semibold text-foreground">{deleteTarget?.id_cuenta}</span>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteTarget)}>Eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}