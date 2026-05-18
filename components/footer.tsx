import Link from "next/link"
import { Crown } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-[#333] bg-[#0a0a0a] mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Crown className="h-6 w-6 text-[#c9a96e]" />
            <span className="text-lg font-bold text-[#c9a96e] font-serif">BuyTheTop</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-[#8a8a8a]">
            <Link href="/help" className="hover:text-[#c9a96e] transition-colors">
              Help
            </Link>
            <Link href="/contact" className="hover:text-[#c9a96e] transition-colors">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-[#c9a96e] transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#c9a96e] transition-colors">
              Privacy
            </Link>
            <span>© 2025 BuyTheTop</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
