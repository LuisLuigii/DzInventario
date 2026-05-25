'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, ShoppingCart, Trash2, Wallet, Copy, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import StatusBadge from '@/components/shared/StatusBadge'
import { format } from 'date-fns'
import { ImageGalleryButton } from '@/components/shared/ImageGalleryButton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import AbonosModal from '@/components/inventory/AbonosModal'

export default function InventoryTable({ items, onEdit, onMarkSold, onDelete, onTogglePublicada, isAdmin }: {
  items: any[]
  onEdit: (item: any) => void
  onMarkSold: (item: any) => void
  onDelete: (item: any) => void
  onTogglePublicada?: (item: any, value: boolean) => void
  isAdmin: boolean
}) {
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [descTarget, setDescTarget] = useState<any>(null)
  const [abonosTarget, setAbonosTarget] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (item: any) => {
    const sep = '╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍ ╍'
    const text = `${sep}\nEPIC GAMES\n${sep}\n${item.correo || ''}\n${item.contrasena_epic || ''}\n${sep}\nAl terminar el mes de garantia se te entrega el full access de la cuenta, esperamos tu referencia amigo https://discord.com/channels/1419142324541456528/1419161169633087548\n${sep}`
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const colSpan = isAdmin ? 13 : 10

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card shadow-lg">
        <Table>
          <TableHeader>
            <TableRow
              className="hover:bg-transparent border-border/60"
              style={{ background: 'linear-gradient(90deg, hsl(225 18% 11%), hsl(225 18% 10%))' }}
            >
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Cuenta</TableHead>
              {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Correo</TableHead>}
              {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pass Correo</TableHead>}
              {isAdmin && <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pass Epic</TableHead>}
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Costo</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio Sug.</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proveedor</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha Compra</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pub.</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imgs.</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                      <span className="text-2xl text-muted-foreground/30">—</span>
                    </div>
                    <p className="text-sm text-muted-foreground">No se encontraron cuentas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.map(item => (
              <TableRow
                key={item.id}
                className="inventory-row border-border/40 transition-colors duration-150 cursor-default"
              >
                <TableCell className="font-mono text-xs font-semibold text-foreground/90">{item.id_cuenta}</TableCell>
                {isAdmin && <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">{item.correo || '—'}</TableCell>}
                {isAdmin && <TableCell className="text-xs font-mono text-muted-foreground">{item.contrasena_correo || '—'}</TableCell>}
                {isAdmin && <TableCell className="text-xs font-mono text-muted-foreground">{item.contrasena_epic || '—'}</TableCell>}
                <TableCell><StatusBadge status={item.estado} /></TableCell>
                <TableCell className="text-xs font-medium text-foreground/80">${item.costo || 0}</TableCell>
                <TableCell className="text-xs font-medium text-foreground/80">${item.precio_sugerido || 0}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.proveedor || '—'}</TableCell>
                <TableCell className="text-xs max-w-[160px]">
                  {item.descripcion ? (
                    <button
                      onClick={() => setDescTarget(item)}
                      className="text-left truncate max-w-[160px] block text-muted-foreground hover:text-primary transition-colors hover:underline cursor-pointer"
                    >
                      {item.descripcion}
                    </button>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.fecha_compra ? format(new Date(item.fecha_compra), 'dd/MM/yy') : '—'}</TableCell>
                <TableCell>
                  {item.estado === 'Disponible' && (
                    <Checkbox
                      checked={!!item.publicada}
                      onCheckedChange={v => onTogglePublicada && onTogglePublicada(item, v as boolean)}
                      className="cursor-pointer"
                    />
                  )}
                </TableCell>
                <TableCell><ImageGalleryButton images={item.imagenes} label="Imágenes de Cuenta" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-all duration-150"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all duration-150"
                      onClick={() => handleCopy(item)}
                    >
                      {copiedId === item.id
                        ? <Check className="w-3.5 h-3.5 text-success" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                    {item.estado === 'Disponible' && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-success hover:bg-success/10 cursor-pointer transition-all duration-150"
                        onClick={() => onMarkSold(item)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {item.estado === 'Apartada' && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-warning hover:bg-warning/10 cursor-pointer transition-all duration-150"
                        onClick={() => setAbonosTarget(item)}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-all duration-150"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!descTarget} onOpenChange={o => !o && setDescTarget(null)}>
        <DialogContent className="max-w-md bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="gradient-text">Descripción — {descTarget?.id_cuenta}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{descTarget?.descripcion}</p>
        </DialogContent>
      </Dialog>

      <AbonosModal item={abonosTarget} open={!!abonosTarget} onOpenChange={o => !o && setAbonosTarget(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border/60">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <span className="font-mono font-semibold text-foreground">{deleteTarget?.id_cuenta}</span>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 cursor-pointer"
              onClick={() => { onDelete(deleteTarget); setDeleteTarget(null) }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}