"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle, Clock, XCircle } from "lucide-react"
import Pagination from "@/components/ui/pagination"
import { usePagination } from "@/hooks/use-pagination"
import { formatCurrency } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  status: string | null | undefined
  description: string | null
  created_at: string
}

interface PaymentHistoryProps {
  payments: Payment[]
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const formatDescription = (description: string) => {
    // Detectar y corregir descripciones con formato antiguo €XX.XX
    const oldFormatRegex = /€(\d+(?:\.\d{2})?)/g
    
    if (oldFormatRegex.test(description)) {
      return description.replace(oldFormatRegex, (match, amount) => {
        const numericAmount = parseFloat(amount)
        return formatCurrency(numericAmount)
      })
    }
    
    return description
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: string | null | undefined) => {
    const safeStatus = status || 'pending'
    switch (safeStatus) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-[#8a8a8a]" />
    }
  }

  const getStatusBadge = (status: string | null | undefined) => {
    const variants = {
      completed: "bg-green-900/20 text-green-400 border-green-700/50",
      pending: "bg-yellow-900/20 text-yellow-400 border-yellow-700/50",
      failed: "bg-red-900/20 text-red-400 border-red-700/50",
      refunded: "bg-blue-900/20 text-blue-400 border-blue-700/50",
    }

    // Handle undefined or null status - default to pending
    const safeStatus = status || 'pending'

    return (
      <Badge className={variants[safeStatus as keyof typeof variants] || "bg-yellow-900/20 text-yellow-400 border-yellow-700/50"}>
        {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
      </Badge>
    )
  }

  // Deduplicate payments - only remove true duplicates
  const uniquePayments = payments.reduce((acc: Payment[], payment) => {
    const hasExactDuplicate = acc.some(existing => {
      // Exact match by ID (most reliable)
      if (existing.id === payment.id) return true
      
      // Very close timestamps (within 10 seconds) with exact same amount and status
      const timeDiff = Math.abs(new Date(existing.created_at).getTime() - new Date(payment.created_at).getTime())
      if (existing.amount === payment.amount && 
          existing.status === payment.status &&
          timeDiff < 10000) { // Within 10 seconds (much more restrictive)
        return true
      }
      
      return false
    })
    
    if (!hasExactDuplicate) {
      acc.push(payment)
    }
    
    return acc
  }, [])

  // Paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedPayments,
    goToPage
  } = usePagination({
    data: uniquePayments,
    itemsPerPage: 5
  })



  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
          <CreditCard className="mr-2 h-6 w-6" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uniquePayments.length > 0 ? (
          <>
            <div className="space-y-4">
              {paginatedPayments.map((payment) => (
                <div key={payment.id} className="bg-[#0a0a0a] p-4 rounded-lg border border-[#333]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(payment.status)}
                      <span className="font-semibold text-[#e5e5e5]">{formatCurrency(payment.amount)}</span>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                  <div className="space-y-1">
                    {payment.description && <p className="text-sm text-[#8a8a8a]">{formatDescription(payment.description)}</p>}
                    <p className="text-xs text-[#666]">{formatDate(payment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-[#333] mx-auto mb-2" />
            <p className="text-[#8a8a8a]">No payments yet</p>
            <p className="text-sm text-[#666]">Your contribution history will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
