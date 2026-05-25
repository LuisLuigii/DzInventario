'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Package, DollarSign, CheckCircle, Clock, TrendingUp, ShieldAlert } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import StatCard from '@/components/shared/StatCard'
import useCurrentUser from '@/lib/useCurrentUser'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['hsl(150,60%,45%)', 'hsl(0,72%,55%)', 'hsl(35,90%,55%)']

export default function Dashboard() {
  const { isAdmin, sellerName } = useCurrentUser()
  const supabase = createClient()

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-dash'],
    queryFn: async () => {
      const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false })
      return data || []
    },
  })

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-dash'],
    queryFn: async () => {
      const { data } = await supabase.from('sales').select('*').order('created_at', { ascending: false })
      return data || []
    },
  })

  const filtered = isAdmin ? inventory : inventory.filter((i: any) => i.seller === sellerName)
  const filteredSales = isAdmin ? sales : sales.filter((s: any) => s.seller === sellerName)

  const available = filtered.filter((i: any) => i.estado === 'Disponible').length
  const sold = filtered.filter((i: any) => i.estado === 'Vendida').length
  const reserved = filtered.filter((i: any) => i.estado === 'Apartada').length
  const totalRevenue = filteredSales.reduce((s: number, r: any) => s + (r.precio_venta || 0), 0)
  const totalProfit = filteredSales.reduce((s: number, r: any) => s + (r.ganancia || 0), 0)

  const pieData = [
    { name: 'Disponible', value: available },
    { name: 'Vendida', value: sold },
    { name: 'Apartada', value: reserved },
  ].filter(d => d.value > 0)

  const sellerStats = ['Deynzo', 'Zana', 'Luigii'].map(name => ({
    name,
    ventas: filteredSales.filter((s: any) => s.seller === name).length,
    ganancia: filteredSales.filter((s: any) => s.seller === name).reduce((a: number, b: any) => a + (b.ganancia || 0), 0),
  }))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={isAdmin ? 'Vista general del negocio' : `Bienvenido, ${sellerName}`} />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Cuentas" value={filtered.length} icon={Package} color="primary" />
        <StatCard title="Disponibles" value={available} icon={CheckCircle} color="success" />
        <StatCard title="Vendidas" value={sold} icon={DollarSign} color="destructive" />
        <StatCard title="Apartadas" value={reserved} icon={Clock} color="warning" />
        <StatCard title="Ingresos" value={`$${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="primary" />
        <StatCard title="Ganancia" value={`$${totalProfit.toLocaleString()}`} icon={ShieldAlert} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold mb-4">Estado de Cuentas</h3>
          <div className="h-64">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(225,15%,10%)', border: '1px solid hsl(225,15%,18%)', borderRadius: '8px', color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sin datos</div>
            )}
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Ventas por Seller</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerStats}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(220,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(220,10%,55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(225,15%,10%)', border: '1px solid hsl(225,15%,18%)', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="ventas" fill="hsl(262,80%,60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}