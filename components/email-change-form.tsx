"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EmailChangeFormProps {
  currentEmail: string
}

export default function EmailChangeForm({ currentEmail }: EmailChangeFormProps) {
  const [newEmail, setNewEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [state, setState] = useState<{
    error?: string
    success?: string
  }>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPending(true)
    setState({}) // Clear previous state
    
    try {
      if (!newEmail || !newEmail.includes('@')) {
        setState({ error: 'Please enter a valid email address.' })
        setPending(false)
        return
      }

      // Enhanced email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        setState({ error: 'Please enter a valid email address with a proper domain.' })
        setPending(false)
        return
      }

      // Check for invalid domains
      const invalidDomains = ['.demo', '.test', '.local', '.invalid']
      if (invalidDomains.some(domain => newEmail.toLowerCase().includes(domain))) {
        setState({ error: 'Please use a real email address.' })
        setPending(false)
        return
      }

      if (newEmail === currentEmail) {
        setState({ error: 'The new email address is the same as your current email address.' })
        setPending(false)
        return
      }

      const response = await fetch('/api/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ new_email: newEmail })
      })

      console.log('📧 Email change request sent:', { new_email: newEmail })

      const result = await response.json()
      
      if (!response.ok) {
        setState({ error: result.error || `Failed to change email (${response.status})` })
      } else {
        setState({ success: result.success })
        setNewEmail("") // Clear form on success
      }
    } catch (error) {
      console.error('Email change error:', error)
      setState({ error: 'Network error: Failed to connect to server. Please check your connection.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-xl font-serif text-[#c9a96e] flex items-center">
          <Mail className="mr-2 h-5 w-5" />
          Change Email Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <Alert className="border-red-700/50 bg-red-900/20 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">{state.error}</AlertDescription>
          </Alert>
        )}

        {state.success && (
          <Alert className="border-green-700/50 bg-green-900/20 mb-4">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">{state.success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#c9a96e]">
              Current Email
            </label>
            <Input
              type="email"
              value={currentEmail}
              disabled
              className="bg-[#0a0a0a] border-[#333] text-[#666] cursor-not-allowed"
            />
          </div>

          {/* New Email */}
          <div className="space-y-2">
            <label htmlFor="newEmail" className="block text-sm font-medium text-[#c9a96e]">
              New Email Address *
            </label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="Enter your new email address"
              className="bg-[#0a0a0a] border-[#333] text-[#e5e5e5] focus:border-[#c9a96e] focus:ring-[#c9a96e]"
            />
            <p className="text-xs text-[#666]">
              A confirmation email will be sent to your new email address
            </p>
          </div>

          <Button
            type="submit"
            disabled={pending || !newEmail}
            className="w-full bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium"
          >
            {pending ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" />
                Sending Confirmation...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Change Email Address
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 p-3 bg-[#333]/20 rounded-md">
          <p className="text-xs text-[#888] leading-relaxed">
            <strong>Note:</strong> After submitting this form, you will receive a confirmation email at your new email address. 
            Your email address will only be changed after you click the confirmation link in that email. 
            You can continue using your current email until the change is confirmed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
