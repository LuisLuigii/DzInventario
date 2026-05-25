'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gamepad2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error('Credenciales incorrectas')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role: 'seller' } },
      })
      if (error) {
        toast.error('Error al registrarse: ' + error.message)
        setLoading(false)
        return
      }
      toast.success('Cuenta creada. Ya puedes iniciar sesión.')
      setMode('login')
      setPassword('')
      setName('')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm p-8 bg-card border border-border rounded-2xl shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
            <Gamepad2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">DeynzoShop</h1>
          <p className="text-sm text-muted-foreground mt-1">La mejor tienda niggas</p>
        </div>

        <div className="flex bg-muted rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'register' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre</Label>
              <Input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-background"
                placeholder="Tu nombre"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-background"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="bg-background"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </Button>
        </form>
      </div>
    </div>
  )
}