"use client"

import { Mail, Clock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContactSupport } from "./contact-support"

const SUPPORT_EMAIL = "support@buythetop.vip"

interface SupportInfoProps {
  showQuickActions?: boolean
  compact?: boolean
  className?: string
}

export function SupportInfo({ showQuickActions = true, compact = false, className }: SupportInfoProps) {
  if (compact) {
    return (
      <div className={`text-center text-sm text-[#8a8a8a] ${className}`}>
        <p>
          Need help? Contact us at{" "}
          <a 
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[#c9a96e] hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-[#1a1a1a] border border-[#333] rounded-lg p-6 ${className}`}>
      <div className="text-center mb-6">
        <h3 className="text-xl font-serif text-[#c9a96e] mb-2">Need Help?</h3>
        <p className="text-[#8a8a8a]">
          Our support team is here to help you
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-3 text-[#e5e5e5]">
          <Mail className="h-5 w-5 text-[#c9a96e]" />
          <div>
            <p className="font-medium">Support Email</p>
            <p className="text-sm text-[#8a8a8a]">{SUPPORT_EMAIL}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[#e5e5e5]">
          <Clock className="h-5 w-5 text-[#c9a96e]" />
          <div>
            <p className="font-medium">Response Time</p>
            <p className="text-sm text-[#8a8a8a]">24-48 hours</p>
          </div>
        </div>
      </div>

      {showQuickActions && (
        <div className="flex flex-col sm:flex-row gap-3">
          <ContactSupport 
            triggerComponent={
              <Button className="flex-1 bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a]">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            }
          />
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = `mailto:${SUPPORT_EMAIL}`}
            className="flex-1 border-[#333] hover:border-[#c9a96e] hover:text-[#c9a96e] text-[#8a8a8a] hover:bg-[#c9a96e]/10"
          >
            <Mail className="mr-2 h-4 w-4" />
            Direct Email
          </Button>
        </div>
      )}
    </div>
  )
}
