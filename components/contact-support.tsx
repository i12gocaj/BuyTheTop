"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Send, MessageCircle, Copy, X } from "lucide-react"
import { toast } from "sonner"

const SUPPORT_EMAIL = "support@buythetop.vip"

interface ContactSupportProps {
  triggerComponent?: React.ReactNode
  className?: string
}

export function ContactSupport({ triggerComponent, className }: ContactSupportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      toast.success("Email copied to clipboard")
    } catch (err) {
      toast.error("Could not copy email")
    }
  }

  const handleEmailContact = () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject || "BuyTheTop Inquiry")}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`
    window.location.href = mailtoUrl
    setIsOpen(false)
    toast.success("Opening email client...")
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError)
        toast.error("Invalid response from server")
        return
      }

      if (response.ok) {
        toast.success(data.message || "Inquiry sent successfully")
        
        // Limpiar formulario
        setName("")
        setEmail("")
        setSubject("")
        setMessage("")
        setIsOpen(false)
      } else {
        // Mostrar errores de validación específicos
        if (data.details && Array.isArray(data.details)) {
          data.details.forEach((detail: string) => {
            toast.error(detail)
          })
        } else {
          toast.error(data.error || "Failed to send inquiry")
        }
      }
      
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error("Failed to send inquiry. Please try again or contact us directly at support@buythetop.vip")
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button className={`bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium ${className}`}>
      <MessageCircle className="mr-2 h-4 w-4" />
      Contact Support
    </Button>
  )

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {triggerComponent || defaultTrigger}
      </div>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#333]">
            <h2 className="text-2xl font-serif text-[#c9a96e] flex items-center">
              <Mail className="mr-2 h-6 w-6" />
              Contact Support
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#8a8a8a] hover:text-[#c9a96e] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Información de contacto directo */}
            <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
              <h3 className="text-[#c9a96e] font-semibold mb-2">Direct Contact</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-[#8a8a8a]" />
                  <span className="text-[#8a8a8a]">{SUPPORT_EMAIL}</span>
                </div>
                <button
                  onClick={copyEmail}
                  className="p-2 bg-[#333] hover:bg-[#c9a96e] hover:text-[#0a0a0a] text-[#8a8a8a] border border-[#333] hover:border-[#c9a96e] rounded-md transition-all duration-200"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Formulario de contacto */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-[#c9a96e]">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-[#0a0a0a] border-[#333] focus:border-[#c9a96e] text-[#e5e5e5] placeholder:text-[#666]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[#c9a96e]">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-[#0a0a0a] border-[#333] focus:border-[#c9a96e] text-[#e5e5e5] placeholder:text-[#666]"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-[#c9a96e]">
                  Subject
                </label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="How can we help you?"
                  className="bg-[#0a0a0a] border-[#333] focus:border-[#c9a96e] text-[#e5e5e5] placeholder:text-[#666]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-[#c9a96e]">
                  Message
                </label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry or issue..."
                  rows={4}
                  className="bg-[#0a0a0a] border-[#333] focus:border-[#c9a96e] text-[#e5e5e5] placeholder:text-[#666] resize-none"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium"
                >
                  {isSubmitting ? (
                    "Preparing..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-[#333] hover:bg-[#444] text-[#e5e5e5] border-0"
                >
                  Cancel
                </Button>
              </div>
            </form>
            
            <div className="text-center text-sm text-[#8a8a8a]">
              <p>We will respond to your inquiry within 24-48 hours.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Componente simple para solo abrir el cliente de email
export function EmailSupport({ children, className }: { children?: React.ReactNode, className?: string }) {
  const handleClick = () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("BuyTheTop Inquiry")}`
    window.location.href = mailtoUrl
  }

  return (
    <Button 
      onClick={handleClick} 
      className={`bg-transparent border border-[#c9a96e] text-[#c9a96e] hover:bg-[#c9a96e] hover:text-[#0a0a0a] ${className}`}
    >
      {children || (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Contact via Email
        </>
      )}
    </Button>
  )
}

// Componente para simplemente mostrar el email y copiarlo
export function SupportEmail({ className }: { className?: string }) {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      toast.success("Email copied to clipboard")
    } catch (err) {
      toast.error("Could not copy email")
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#333] rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <Mail className="h-4 w-4 text-[#c9a96e]" />
        <span className="text-[#e5e5e5] font-medium">{SUPPORT_EMAIL}</span>
      </div>
      <button
        onClick={copyEmail}
        className="p-2 bg-[#333] hover:bg-[#c9a96e] hover:text-[#0a0a0a] text-[#8a8a8a] border border-[#333] hover:border-[#c9a96e] rounded-md transition-all duration-200"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  )
}
