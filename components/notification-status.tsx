"use client"

import { Mail, Check, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface NotificationStatusProps {
  isEnabled: boolean
  userEmail?: string
}

export default function NotificationStatus({ isEnabled, userEmail }: NotificationStatusProps) {
  return (
    <Card className="bg-[#1a1a1a] border-[#333] mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isEnabled ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
              <Mail className={`w-4 h-4 ${isEnabled ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#e5e5e5]">
                Position Change Notifications
              </p>
              <p className="text-xs text-[#666]">
                {userEmail || 'Your email address'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEnabled ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Active</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Disabled</span>
              </>
            )}
          </div>
        </div>
        <p className="text-xs text-[#888] mt-2">
          {isEnabled 
            ? "You'll receive an email when someone surpasses your ranking position."
            : "Email notifications for position changes are disabled."
          }
        </p>
      </CardContent>
    </Card>
  )
}
