'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { AuthProvider } from '@/lib/AuthContext'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}