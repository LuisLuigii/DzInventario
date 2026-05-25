'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Shield, Pencil } from 'lucide-react'
import PageHeader from '@/components/shared/PageHeader'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('seller')
  const [editUser, setEditUser] = useState<any>(null)
  const [editSellerName, setEditSellerName] = useState('')
  const [editRole, setEditRole] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      return data || []
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: { role: inviteRole, seller_name: '' }
      })
      if (error) throw error
    },
    onSuccess: () => { toast.success('Invitación enviada'); setInviteOpen(false); setInviteEmail('') },
    onError: (err: any) => toast.error('Error: ' + err.message),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditUser(null); toast.success('Usuario actualizado') },
  })

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestión de acceso al sistema">
        <Button size="sm" onClick={() => setInviteOpen(true)}><UserPlus className="w-4 h-4 mr-2" /> Invitar Usuario</Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['Nombre','Email','Rol','Seller Name','Registro','Acciones'].map(h => <TableHead key={h} className="text-xs font-semibold">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users as any[]).map(u => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={u.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-secondary text-secondary-foreground'}>
                      <Shield className="w-3 h-3 mr-1" />{u.role || 'seller'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.seller_name || '—'}</TableCell>
                  <TableCell className="text-xs">{u.created_at ? format(new Date(u.created_at), 'dd/MM/yyyy') : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditUser(u); setEditSellerName(u.seller_name || ''); setEditRole(u.role || 'seller') }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Invitar Usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="bg-background" placeholder="correo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Select value={inviteRole} onValueChange={v => setInviteRole(v ?? 'seller')}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail}>Enviar Invitación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={o => !o && setEditUser(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Select value={editRole} onValueChange={v => setEditRole(v ?? '')}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Seller Name</Label>
              <Select value={editSellerName} onValueChange={v => setEditSellerName(v ?? '')}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Asignar seller" /></SelectTrigger>
                <SelectContent>
                  {['Deynzo','Zana','Luigii'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={() => updateMutation.mutate({ id: editUser.id, data: { role: editRole, seller_name: editSellerName } })}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}