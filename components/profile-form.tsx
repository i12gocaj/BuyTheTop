"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Save, AlertCircle, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isValidDisplayName } from "@/lib/validation"
import AvatarUpload from "@/components/avatar-upload"
import { ContentValidation } from "@/components/content-validation"
import { Switch } from "@/components/ui/switch"

interface ProfileFormProps {
  user: any
  userProfile: any
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium"
    >
      {pending ? (
        <>
          <Save className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Save Profile
        </>
      )}
    </Button>
  )
}

export default function ProfileForm({ user, userProfile }: ProfileFormProps) {
  const [state, setState] = useState<any>(null)
  const [pending, setPending] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(userProfile?.avatar_url || null)
  const [displayName, setDisplayName] = useState(userProfile?.display_name || "")
  const [bio, setBio] = useState(userProfile?.description || "")
  const [positionNotificationsEnabled, setPositionNotificationsEnabled] = useState(
    userProfile?.position_notifications_enabled ?? true
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setValidationErrors([])
    setState(null) // Limpiar estado anterior
    
    try {
      // Verificar que el usuario esté autenticado
      if (!user || !user.id) {
        setState({ error: 'Authentication required. Please log in again.' })
        setPending(false)
        return
      }

      const formData = new FormData(e.currentTarget)
      
      // Validaciones del lado cliente
      const displayName = formData.get("displayName") as string
      const description = formData.get("description") as string
      const errors: string[] = []

      // Validar display name
      if (displayName) {
        if (displayName.length > 25) {
          errors.push("Display name cannot exceed 25 characters")
        } else if (!isValidDisplayName(displayName)) {
          errors.push("Display name contains invalid characters (avoid HTML tags or script content)")
        }
      }

      // Validar bio
      if (description) {
        if (description.length > 100) {
          errors.push("Bio cannot exceed 100 characters")
        } else {
          // Check for suspicious patterns
          const suspiciousPatterns = [
            /javascript:/i,
            /data:text\/html/i,
            /vbscript:/i,
            /<script/i,
            /on\w+\s*=/i
          ]
          
          if (suspiciousPatterns.some(pattern => pattern.test(description))) {
            errors.push("Bio contains potentially dangerous content")
          } else {
            const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi
            const urlMatches = description.match(urlPattern)
            if (urlMatches && urlMatches.length > 1) {
              errors.push("Bio can contain at most 1 URL")
            }
          }
        }
      }

      if (errors.length > 0) {
        setValidationErrors(errors)
        // No setear state.error para evitar mostrar el error dos veces
        setPending(false) // Importante: limpiar el estado de pending
        return
      }

      // Preparar datos para la API usando el esquema correcto
      const profileData = {
        display_name: displayName,
        bio: description,
        position_notifications_enabled: positionNotificationsEnabled
      }

      // Llamar a la nueva API de actualización de perfil
      const response = await fetch('/api/update-profile-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante: incluir cookies para autenticación
        body: JSON.stringify(profileData)
      })

      const result = await response.json()
      
      if (!response.ok) {
        console.error('Profile update failed:', response.status, result)
        if (response.status === 401) {
          setState({ error: 'Session expired. Please log in again.' })
        } else {
          setState({ error: result.error || `Failed to update profile (${response.status})` })
        }
      } else {
        setState({ success: result.success })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setState({ error: 'Network error: Failed to connect to server. Please check your connection.' })
    } finally {
      setPending(false)
    }
  }

  const handleAvatarChange = (url: string | null) => {
    setCurrentAvatarUrl(url)
    // No mostrar mensaje aquí ya que AvatarUpload maneja sus propios mensajes
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <User className="mr-2 h-6 w-6" />
          Profile Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="userId" value={user.id} />

          {state?.error && (
            <Alert className="border-red-700/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">{state.error}</AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert className="border-red-700/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {state?.success && (
            <Alert className="border-green-700/50 bg-green-900/20">
              <AlertCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">{state.success}</AlertDescription>
            </Alert>
          )}

          {/* Avatar Upload */}
          <AvatarUpload
            currentAvatarUrl={currentAvatarUrl}
            userDisplayName={userProfile?.display_name}
            userEmail={user.email}
            onAvatarChange={handleAvatarChange}
          />

          {/* Display Name */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-[#c9a96e]">
              Display Name *
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={25}
              placeholder="Enter your display name"
              className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e]"
            />
            <ContentValidation
              content={displayName}
              contentType="display_name"
              showSuggestions={true}
            />
            <div className="flex justify-between text-xs">
              <p className="text-[#666]">This name will be shown in the ranking</p>
              <p className="text-[#666]">Max 25 characters ({displayName.length}/25)</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-[#c9a96e]">
              Bio
            </label>
            <Textarea
              id="description"
              name="description"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              placeholder="Tell others about yourself..."
              rows={4}
              className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e] resize-none"
            />
            <ContentValidation
              content={bio}
              contentType="bio"
              showSuggestions={true}
            />
            <div className="flex justify-between text-xs">
              <p className="text-[#666]">Max 100 characters ({bio.length}/100) | 1 URL max</p>
            </div>
          </div>

          {/* Email (read-only with change option) */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-[#c9a96e]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-[#0a0a0a] border-[#333] text-[#666] cursor-not-allowed"
            />
            <p className="text-xs text-[#666]">
              To change your email address, use the "Change Email Address" section below
            </p>
          </div>

          {/* Position Notifications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label htmlFor="position-notifications" className="block text-sm font-medium text-[#c9a96e] flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  Position Change Notifications
                </label>
                <p className="text-xs text-[#666]">
                  Receive email notifications when someone surpasses your ranking position
                </p>
              </div>
              <Switch
                id="position-notifications"
                checked={positionNotificationsEnabled}
                onCheckedChange={setPositionNotificationsEnabled}
              />
            </div>
          </div>

          <SubmitButton pending={pending} />
        </form>
      </CardContent>
    </Card>
  )
}
