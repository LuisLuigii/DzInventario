import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

export default function InventoryFilters({ search, onSearchChange, estado, onEstadoChange, proveedor, onProveedorChange, proveedores }: {
  search: string
  onSearchChange: (v: string) => void
  estado: string
  onEstadoChange: (v: string) => void
  proveedor: string
  onProveedorChange: (v: string) => void
  proveedores: string[]
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5 p-3 rounded-xl bg-card/60 border border-border/60 backdrop-blur-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por ID, correo, descripción..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9 bg-background/60 border-border/60 focus:border-primary/50 transition-colors"
        />
      </div>
      <Select value={estado} onValueChange={v => onEstadoChange(v ?? 'all')}>
        <SelectTrigger className="w-40 bg-background/60 border-border/60 cursor-pointer">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          <SelectItem value="Disponible">Disponible</SelectItem>
          <SelectItem value="Vendida">Vendida</SelectItem>
          <SelectItem value="Apartada">Apartada</SelectItem>
        </SelectContent>
      </Select>
      <Select value={proveedor} onValueChange={v => onProveedorChange(v ?? 'all')}>
        <SelectTrigger className="w-40 bg-background/60 border-border/60 cursor-pointer">
          <SelectValue placeholder="Proveedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {proveedores.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}