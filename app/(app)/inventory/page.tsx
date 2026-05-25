'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/shared/PageHeader'
import Pagination from '@/components/shared/Pagination'
import InventoryFilters from '@/components/inventory/InventoryFilters'
import InventoryTable from '@/components/inventory/InventoryTable'
import InventoryEditDialog from '@/components/inventory/InventoryEditDialog'
import SellDialog from '@/components/inventory/SellDialog'
import ImportDialog from '@/components/inventory/ImportDialog'
import useCurrentUser from '@/lib/useCurrentUser'
import { toast } from 'sonner'

const PAGE_SIZE = 100

export default function Inventory() {
  const { isAdmin, sellerName } = useCurrentUser()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('all')
  const [proveedorFilter, setProveedorFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editItem, setEditItem] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [sellItem, setSellItem] = useState<any>(null)
  const [importOpen, setImportOpen] = useState(false)

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
      return data || []
    },
  })

  const proveedores = useMemo(() => [...new Set(inventory.map((i: any) => i.proveedor).filter(Boolean))] as string[], [inventory])

  const filtered = useMemo(() => {
    let list = inventory as any[]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i => (i.id_cuenta || '').toLowerCase().includes(q) || (i.correo || '').toLowerCase().includes(q) || (i.descripcion || '').toLowerCase().includes(q))
    }
    if (estadoFilter !== 'all') list = list.filter(i => i.estado === estadoFilter)
    if (proveedorFilter !== 'all') list = list.filter(i => i.proveedor === proveedorFilter)
    return list
  }, [inventory, search, estadoFilter, proveedorFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data
        const { error } = await supabase.from('inventory').update(rest).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('inventory').insert(data)
        if (error) throw error
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); setEditOpen(false); toast.success('Cuenta guardada') },
  })

  const sellMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const { error: saleError } = await supabase.from('sales').insert(saleData)
      if (saleError) throw saleError
      const item = inventory.find((i: any) => i.id_cuenta === saleData.id_cuenta) as any
      if (item) await supabase.from('inventory').update({ estado: 'Vendida', publicada: false }).eq('id', item.id)
      await supabase.from('movimientos').insert({
        tipo: 'INGRESO',
        monto: saleData.precio_venta,
        fecha: saleData.fecha_venta,
        metodo: saleData.metodo_pago || 'Transferencia',
        descripcion: `Venta cuenta ${saleData.id_cuenta}`,
        referencia: saleData.canal_venta || 'Discord',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      setSellItem(null)
      toast.success('Venta registrada')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase.from('inventory').delete().eq('id', item.id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['inventory'] }); toast.success('Cuenta eliminada') },
  })

  const togglePublicadaMutation = useMutation({
    mutationFn: async ({ item, value }: { item: any; value: boolean }) => {
      await supabase.from('inventory').update({ publicada: value }).eq('id', item.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })

  return (
    <div>
      <PageHeader title="Inventario" description={`${filtered.length} cuentas`}>
        {isAdmin && <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4 mr-2" /> Importar</Button>}
        <Button size="sm" onClick={() => { setEditItem(null); setEditOpen(true) }}><Plus className="w-4 h-4 mr-2" /> Nueva Cuenta</Button>
      </PageHeader>

      <InventoryFilters
        search={search} onSearchChange={v => { setSearch(v); setPage(1) }}
        estado={estadoFilter} onEstadoChange={v => { setEstadoFilter(v); setPage(1) }}
        proveedor={proveedorFilter} onProveedorChange={v => { setProveedorFilter(v); setPage(1) }}
        proveedores={proveedores}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <InventoryTable
            items={paginated}
            isAdmin={isAdmin}
            onEdit={item => { setEditItem(item); setEditOpen(true) }}
            onMarkSold={item => setSellItem(item)}
            onDelete={item => deleteMutation.mutate(item)}
            onTogglePublicada={(item, value) => togglePublicadaMutation.mutate({ item, value })}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <InventoryEditDialog open={editOpen} onOpenChange={setEditOpen} item={editItem} onSave={data => saveMutation.mutate(editItem ? { ...data, id: editItem.id } : data)} allItems={inventory} />
      <SellDialog open={!!sellItem} onOpenChange={open => !open && setSellItem(null)} item={sellItem} onSell={data => sellMutation.mutate(data)} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}