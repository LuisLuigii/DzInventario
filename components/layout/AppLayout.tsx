'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="h-14 border-b border-border/60 flex items-center px-4 lg:hidden shrink-0 bg-card/50 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-bold text-sm gradient-text">DeynzoShop</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-dot-grid">
          {children}
        </main>
      </div>
    </div>
  )
}