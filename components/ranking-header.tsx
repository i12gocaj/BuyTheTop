'use client'

import { memo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Crown, LogOut, User, Plus, HelpCircle, Shield } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client"
import CompactStats from "@/components/compact-stats"

interface AuthUser {
  id: string
  email: string
  role?: string
  isAdmin?: boolean
}

const RankingHeader = memo(function RankingHeader() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          setLoading(false)
          return
        }

        const supabase = getSupabaseClient()
        if (!supabase) {
          setLoading(false)
          return
        }

        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user role
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'user',
            isAdmin: profile?.role === 'admin'
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleSignOut = async () => {
    try {
      // 1) Intenta cerrar sesión en el servidor (limpia cookies/sesión SSR)
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => { /* ignore */ })

      // 2) Fallback: cierra sesión también en el cliente si está configurado
      if (isSupabaseConfigured) {
        const supabase = getSupabaseClient()
        if (supabase) {
          try { await supabase.auth.signOut() } catch { /* ignore */ }
        }
      }

      // 3) Navega sin tocar el estado React para evitar re-render inmediato
      window.location.replace('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Show a simple header while loading or not mounted
  if (!mounted || loading) {
    return (
      <header className="border-b border-[#333]/50 bg-[#0a0a0a]/98 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Crown className="h-9 w-9 text-[#c9a96e] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </div>
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#c9a96e] to-[#f4e27a] font-serif tracking-wide">
              BuyTheTop
            </span>
          </Link>
          <div className="animate-pulse h-8 w-24 bg-[#333] rounded"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-[#333]/50 bg-[#0a0a0a]/98 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Crown className="h-9 w-9 text-[#c9a96e] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <div className="absolute inset-0 h-9 w-9 text-[#c9a96e]/30 blur-sm group-hover:text-[#c9a96e]/50 transition-all duration-300">
              <Crown className="h-9 w-9" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#c9a96e] font-serif tracking-wide group-hover:scale-105 transition-transform duration-300 drop-shadow-lg">
            BuyTheTop
          </span>
        </Link>

        <nav className="flex items-center space-x-2 lg:space-x-4">
          {/* Estadísticas compactas - solo en desktop */}
          <div className="hidden lg:block">
            <CompactStats />
          </div>
          
          <Link href="/help">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-[#8a8a8a] hover:text-white hover:bg-[#c9a96e]/20 transition-all duration-300 hidden sm:flex"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-[#8a8a8a] hover:text-white hover:bg-[#c9a96e]/20 transition-all duration-300"
                >
                  <User className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>

              {user.isAdmin && (
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-[#f4e27a] hover:text-white hover:bg-[#f4e27a]/20 transition-all duration-300"
                  >
                    <Shield className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin Panel</span>
                  </Button>
                </Link>
              )}
              
              <Link href="/contribute">
                <Button className="bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium shadow-lg shadow-[#c9a96e]/20 border-2 border-[#c9a96e]/80 hover:border-[#b8956a] transition-all duration-300 hover:shadow-xl hover:shadow-[#c9a96e]/30 hover:scale-105">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Contribute</span>
                </Button>
              </Link>

              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-[#8a8a8a] hover:text-white hover:bg-[#c9a96e]/20 transition-all duration-300"
                >
                  Sign In
                </Button>
              </Link>
              
              <Link href="/auth/sign-up">
                <Button className="bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium shadow-lg shadow-[#c9a96e]/20 border-2 border-[#c9a96e]/80 hover:border-[#b8956a] transition-all duration-300 hover:shadow-xl hover:shadow-[#c9a96e]/30 hover:scale-105">
                  <Crown className="h-4 w-4 mr-2" />
                  <span>Register</span>
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
})

export default RankingHeader
