'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, DollarSign, GitPullRequest, Users, LogOut, Gamepad2, X, Calculator } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import useCurrentUser from '@/lib/useCurrentUser'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventario', path: '/inventory', icon: Package },
  { label: 'Ventas', path: '/sales', icon: DollarSign },
  { label: 'Pulls', path: '/pulls', icon: GitPullRequest },
  { label: 'Arqueo', path: '/arqueo', icon: Calculator, adminOnly: true },
  { label: 'Usuarios', path: '/users', icon: Users, adminOnly: true },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { user, isAdmin } = useCurrentUser()

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-sidebar
        flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        border-r border-sidebar-border
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, hsl(262 85% 62% / 0.08), transparent)' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg, hsl(262 85% 62% / 0.3), hsl(280 80% 65% / 0.15))', border: '1px solid hsl(262 85% 62% / 0.3)' }}>
              <Gamepad2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-sm gradient-text">DeynzoShop</h1>
              <p className="text-[10px] text-muted-foreground tracking-wide">La mejor tienda niggas</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredNav.map(item => {
            const active = pathname === item.path
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 cursor-pointer relative group
                  ${active
                    ? 'text-primary'
                    : 'text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/60'}
                `}
                style={active ? {
                  background: 'linear-gradient(90deg, hsl(262 85% 62% / 0.15), hsl(262 85% 62% / 0.05))',
                  boxShadow: 'inset 3px 0 0 hsl(262 85% 62%)',
                } : {}}
              >
                <item.icon className={`w-4 h-4 shrink-0 transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-sidebar-accent-foreground'}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                    style={{ boxShadow: '0 0 6px hsl(262 85% 62%)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-sidebar-border/60">
          <div className="px-3 py-2.5 mb-1 rounded-lg bg-sidebar-accent/40 border border-sidebar-border/40">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
              {isAdmin ? (
                <span className="text-primary font-medium">Admin</span>
              ) : (
                user?.user_metadata?.role || 'seller'
              )}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full cursor-pointer group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  )
}