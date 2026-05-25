'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface CurrentUser extends User {
  role?: string
  seller_name?: string
}

export default function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          ...data.user,
          role: data.user.user_metadata?.role,
          seller_name: data.user.user_metadata?.seller_name,
        })
      }
      setLoading(false)
    })
  }, [])

  const isAdmin = user?.role === 'admin'
  const sellerName = user?.seller_name || null

  return { user, loading, isAdmin, sellerName }
}