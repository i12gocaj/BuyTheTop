'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertCircle, Users, TrendingUp, Activity, Shield, Trash2, Edit3, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from "@/lib/utils"

interface AuthUser {
  id: string
  email: string
  role?: string
  isAdmin?: boolean
}

interface AdminStats {
  totalUsers: number
  totalProfiles: number
  totalPositions: number
  adminUsers: number
  recentActivity?: number
  authUsersCount?: number
  confirmedUsers?: number
  lastActivity?: string
  error?: string
  timestamp?: string
}

interface User {
  id: string
  email: string
  display_name: string
  description: string
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  email_confirmed: boolean
}

interface Position {
  user_id: string
  total_contribution: number
  current_position: number
  position_acquired_at: string
  user_profiles: {
    display_name: string
    avatar_url: string | null
  }
}

export default function AdminPanel() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'positions'>('stats')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ display_name: '', description: '' })

  useEffect(() => {
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
        } else {
          // If no user is authenticated, redirect to login after a brief delay
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 1000)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // If there's an error, also redirect to login
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 1000)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoadingStats(true)
      setError(null)
      
      const response = await fetch('/api/admin/stats-simple', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText} - ${errorData}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch admin statistics')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      setError(null)
      
      const response = await fetch('/api/admin/manage-users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to fetch users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchPositions = async () => {
    try {
      setLoadingPositions(true)
      setError(null)
      
      const response = await fetch('/api/admin/manage-positions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }

      const data = await response.json()
      setPositions(data.positions || [])
    } catch (error) {
      console.error('Error fetching positions:', error)
      setError('Failed to fetch positions')
    } finally {
      setLoadingPositions(false)
    }
  }

  const updateUserProfile = async (userId: string, profileData: { display_name: string; description: string }) => {
    try {
      const response = await fetch('/api/admin/manage-users', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'update_profile',
          data: profileData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      await fetchUsers()
      setEditingUser(null)
      setEditForm({ display_name: '', description: '' })
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    }
  }

  const removeUserAvatar = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/manage-users', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          action: 'remove_avatar'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to remove avatar')
      }

      await fetchUsers()
    } catch (error) {
      console.error('Error removing avatar:', error)
      setError('Failed to remove avatar')
    }
  }

  const changeUserRole = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return

    try {
      const response = await fetch('/api/admin/change-role', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change user role')
      }

      await fetchUsers()
    } catch (error) {
      console.error('Error changing user role:', error)
      setError(error instanceof Error ? error.message : 'Failed to change user role')
    }
  }

  const deleteUser = async (userId: string) => {
    // Obtener información del usuario para mostrar en la confirmación
    const userItem = users.find(u => u.id === userId)
    const userName = userItem?.display_name || userItem?.email || 'Usuario desconocido'
    
    const confirmMessage = `⚠️ ADVERTENCIA: Esta acción eliminará COMPLETAMENTE al usuario "${userName}" y TODOS sus datos relacionados:

• Perfil de usuario
• Posición en el ranking (si existe)
• Historial de pagos
• Historial de posiciones  
• Cuenta de autenticación

Esta acción NO SE PUEDE DESHACER.

¿Estás seguro de que quieres eliminar completamente a este usuario?`

    if (!confirm(confirmMessage)) return

    try {
      setError(null)
      const response = await fetch('/api/admin/manage-positions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      const result = await response.json()
      
      // Mostrar mensaje de éxito con detalles
      let successMessage = `✅ Usuario eliminado exitosamente!\n\n`
      
      if (result.userDeletion) {
        const deleted = result.userDeletion.deletedData
        successMessage += `Datos eliminados:\n`
        successMessage += `• Perfil: ${deleted.profile ? '✅' : '❌'}\n`
        successMessage += `• Ranking: ${deleted.ranking ? '✅' : '❌'}\n`
        successMessage += `• Pagos: ${deleted.payments ? '✅' : '❌'}\n`
        successMessage += `• Historial: ${deleted.positionHistory ? '✅' : '❌'}\n`
        successMessage += `• Autenticación: ${deleted.authUser ? '✅' : '❌'}\n\n`
      }
      
      if (result.recalculation) {
        successMessage += `Posiciones recalculadas: ${result.recalculation.updatedPositions}/${result.recalculation.totalPositions}`
      }
      
      alert(successMessage)
      
      // Refrescar ambas listas ya que el usuario fue eliminado completamente
      await fetchUsers()
      if (positions.length > 0) {
        await fetchPositions()
      }
      
    } catch (error) {
      console.error('Error deleting user:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const deletePosition = async (userId: string) => {
    // Obtener información del usuario para mostrar en la confirmación
    const position = positions.find(p => p.user_id === userId)
    const userName = position?.user_profiles?.display_name || 'Usuario desconocido'
    
    const confirmMessage = `⚠️ ADVERTENCIA: Esta acción eliminará COMPLETAMENTE al usuario "${userName}" y TODOS sus datos relacionados:

• Perfil de usuario
• Posición en el ranking  
• Historial de pagos
• Historial de posiciones
• Cuenta de autenticación

Esta acción NO SE PUEDE DESHACER.

¿Estás seguro de que quieres eliminar completamente a este usuario?`

    if (!confirm(confirmMessage)) return

    try {
      setError(null)
      const response = await fetch('/api/admin/manage-positions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      const result = await response.json()
      
      // Mostrar mensaje de éxito con detalles
      let successMessage = `✅ Usuario eliminado exitosamente!\n\n`
      
      if (result.userDeletion) {
        const deleted = result.userDeletion.deletedData
        successMessage += `Datos eliminados:\n`
        successMessage += `• Perfil: ${deleted.profile ? '✅' : '❌'}\n`
        successMessage += `• Ranking: ${deleted.ranking ? '✅' : '❌'}\n`
        successMessage += `• Pagos: ${deleted.payments ? '✅' : '❌'}\n`
        successMessage += `• Historial: ${deleted.positionHistory ? '✅' : '❌'}\n`
        successMessage += `• Autenticación: ${deleted.authUser ? '✅' : '❌'}\n\n`
      }
      
      if (result.recalculation) {
        successMessage += `Posiciones recalculadas: ${result.recalculation.updatedPositions}/${result.recalculation.totalPositions}`
      }
      
      alert(successMessage)
      
      // Refrescar ambas listas ya que el usuario fue eliminado completamente
      await fetchPositions()
      await fetchUsers()
      
    } catch (error) {
      console.error('Error deleting user:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete user')
    }
  }

  const recalculatePositions = async () => {
    if (!confirm('This will recalculate all position numbers to ensure they are sequential. Continue?')) return

    try {
      setError(null)
      const response = await fetch('/api/admin/recalculate-positions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to recalculate positions')
      }

      const result = await response.json()
      
      // Refresh the positions list
      await fetchPositions()
      
      // Show success message with details
      alert(`Position recalculation completed successfully!\n\nTotal positions: ${result.results.totalPositions}\nUpdated positions: ${result.results.updatedPositions}\nPositions already correct: ${result.results.skippedPositions}`)
      
    } catch (error) {
      console.error('Error recalculating positions:', error)
      setError(error instanceof Error ? error.message : 'Failed to recalculate positions')
    }
  }

  useEffect(() => {
    if (user && !loading) {
      fetchAdminStats()
    }
  }, [user, loading])

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers()
    } else if (activeTab === 'positions' && positions.length === 0) {
      fetchPositions()
    }
  }, [activeTab, users.length, positions.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading admin panel...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
        <div className="container mx-auto px-4 py-8">
          <Alert className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must log in to access the admin panel.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] pb-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-full flex justify-start">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rankings
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-[#c9a96e]" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#c9a96e]">Moderation Panel</h1>
              <p className="text-[#8a8a8a]">
                User, content and position management
              </p>
            </div>
            <Badge variant="secondary" className="bg-[#c9a96e] text-[#0a0a0a]">
              Admin
            </Badge>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 bg-[#1a1a1a] border-red-500 text-[#e5e5e5]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'stats' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stats')}
            className={activeTab === 'stats' 
              ? 'bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]' 
              : 'bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]'
            }
          >
            <Activity className="h-4 w-4 mr-2" />
            Statistics
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' 
              ? 'bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]' 
              : 'bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]'
            }
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Button>
          <Button 
            variant={activeTab === 'positions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('positions')}
            className={activeTab === 'positions' 
              ? 'bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]' 
              : 'bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]'
            }
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Manage Positions
          </Button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#e5e5e5]">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-[#8a8a8a]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#c9a96e]">
                    {loadingStats ? '...' : (stats?.totalUsers ?? 0)}
                  </div>
                  <p className="text-xs text-[#8a8a8a]">
                    Users with profiles
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#e5e5e5]">Positions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-[#8a8a8a]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#c9a96e]">
                    {loadingStats ? '...' : (stats?.totalPositions ?? 0)}
                  </div>
                  <p className="text-xs text-[#8a8a8a]">
                    Users in rankings
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#e5e5e5]">Administrators</CardTitle>
                  <Shield className="h-4 w-4 text-[#8a8a8a]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#c9a96e]">
                    {loadingStats ? '...' : (stats?.adminUsers ?? 0)}
                  </div>
                  <p className="text-xs text-[#8a8a8a]">
                    Admin users
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[#e5e5e5]">System Users</CardTitle>
                  <Activity className="h-4 w-4 text-[#8a8a8a]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#8a8a8a]">
                    {loadingStats ? '...' : (stats?.authUsersCount ?? 0)}
                  </div>
                  <p className="text-xs text-[#8a8a8a]">
                    Total auth accounts
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional system information */}
            {stats && (
              <Card className="bg-[#1a1a1a] border-[#333]">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-[#c9a96e]">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#8a8a8a]">Confirmed users:</span>
                      <span className="ml-2 text-[#e5e5e5]">{stats.confirmedUsers || 0}</span>
                    </div>
                    <div>
                      <span className="text-[#8a8a8a]">Incomplete registrations:</span>
                      <span className="ml-2 text-[#e5e5e5]">{(stats.authUsersCount || 0) - (stats.totalUsers || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[#8a8a8a]">Last activity:</span>
                      <span className="ml-2 text-[#e5e5e5]">{stats.lastActivity || 'No recent activity'}</span>
                    </div>
                    <div>
                      <span className="text-[#8a8a8a]">Data updated:</span>
                      <span className="ml-2 text-[#e5e5e5]">{stats.timestamp ? new Date(stats.timestamp).toLocaleString() : 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#c9a96e]">User Management</h2>
              <Button 
                onClick={fetchUsers} 
                disabled={loadingUsers}
                className="bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]"
              >
                {loadingUsers ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            <div className="grid gap-4">
              {users.map((userItem) => (
                <Card key={userItem.id} className="p-4 bg-[#1a1a1a] border-[#333]">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={userItem.avatar_url || undefined} 
                          alt={userItem.display_name || 'User avatar'}
                        />
                        <AvatarFallback className="bg-[#333] text-[#8a8a8a]">
                          <Users className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      {editingUser === userItem.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editForm.display_name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                            placeholder="Display name"
                            className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5]"
                          />
                          <Input
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Biography"
                            className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5]"
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => updateUserProfile(userItem.id, editForm)}
                              className="bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]"
                            >
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingUser(null)
                                setEditForm({ display_name: '', description: '' })
                              }}
                              className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-[#e5e5e5]">{userItem.display_name || 'No name'}</h3>
                            <Badge variant={userItem.role === 'admin' ? 'default' : 'secondary'} 
                                   className={userItem.role === 'admin' ? 'bg-[#c9a96e] text-[#0a0a0a]' : 'bg-[#333] text-[#e5e5e5]'}>
                              {userItem.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#8a8a8a] mb-1">{userItem.email}</p>
                          {userItem.description && (
                            <p className="text-sm text-[#b8b8b8] mb-2">{userItem.description}</p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingUser(userItem.id)
                                setEditForm({
                                  display_name: userItem.display_name || '',
                                  description: userItem.description || ''
                                })
                              }}
                              className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]"
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            {userItem.avatar_url && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => removeUserAvatar(userItem.id)}
                                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]"
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Remove Photo
                              </Button>
                            )}
                            {/* Role management buttons */}
                            {userItem.role === 'user' ? (
                              <Button 
                                size="sm" 
                                onClick={() => changeUserRole(userItem.id, 'admin')}
                                className="bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                            ) : userItem.id !== user?.id ? (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => changeUserRole(userItem.id, 'user')}
                                className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]"
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Remove Admin
                              </Button>
                            ) : null}
                            {/* Delete user button - only show for other users */}
                            {userItem.id !== user?.id && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteUser(userItem.id)}
                                className="bg-red-600 text-white hover:bg-red-700"
                                title="Eliminar usuario completamente (perfil, ranking, pagos, etc.)"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete User
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Positions Management Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#c9a96e]">Position Management</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={recalculatePositions} 
                  variant="outline"
                  className="bg-[#1a1a1a] border-[#333] text-[#e5e5e5] hover:bg-[#2a2a2a]"
                >
                  🔧 Fix Positions
                </Button>
                <Button 
                  onClick={fetchPositions} 
                  disabled={loadingPositions}
                  className="bg-[#c9a96e] text-[#0a0a0a] hover:bg-[#b8956a]"
                >
                  {loadingPositions ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {positions.map((position) => (
                <Card key={position.user_id} className="p-4 bg-[#1a1a1a] border-[#333]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage 
                            src={position.user_profiles?.avatar_url || undefined} 
                            alt={position.user_profiles?.display_name || 'User avatar'}
                          />
                          <AvatarFallback className="bg-[#333] text-[#8a8a8a]">
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#e5e5e5]">Position #{position.current_position}</h3>
                        <p className="text-sm text-[#8a8a8a]">
                          {position.user_profiles?.display_name || 'Unknown user'}
                        </p>
                        <p className="text-sm text-[#c9a96e]">
                          Total contribution: {formatCurrency(position.total_contribution)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => deletePosition(position.user_id)}
                        className="bg-red-600 text-white hover:bg-red-700"
                        title="Eliminar usuario completamente (perfil, ranking, pagos, etc.)"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete User
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
