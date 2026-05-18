import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, ArrowLeft, Crown, Coins, Users, Shield } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

export const runtime = 'edge'

// Generar metadata estática
export const metadata: Metadata = {
  title: "Help & FAQ - BuyTheTop",
  description: "Get help and find answers to frequently asked questions about BuyTheTop ranking platform. Learn how to contribute, track rankings, and navigate the platform.",
  keywords: ["help", "FAQ", "frequently asked questions", "guide", "tutorial", "support", "ranking platform"],
  openGraph: {
    title: "Help & FAQ - BuyTheTop",
    description: "Get help and find answers to frequently asked questions about BuyTheTop ranking platform.",
    type: "website",
  },
  alternates: {
    canonical: "/help",
  },
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-[#8a8a8a] hover:text-[#c9a96e] hover:bg-[#1a1a1a]">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Ranking
            </Button>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Help & FAQ</h1>
          <p className="text-xl text-[#8a8a8a]">Everything you need to know about BuyTheTop</p>
        </div>

        <div className="space-y-8">
          {/* How it Works */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Crown className="mr-2 h-6 w-6" />
                How BuyTheTop Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <p>
                BuyTheTop is a monetary ranking system where your position is determined by your total contributions.
                The more you contribute, the higher you climb in the hierarchy.
              </p>
              <ul className="space-y-2 text-[#8a8a8a]">
                <li>• Higher contributions = better positions</li>
                <li>• Minimum contribution: 1,00 €</li>
                <li>• To overtake someone, contribute at least 0,01 € more than their total</li>
                <li>• In case of equal contributions, later contributors rank lower</li>
                <li>• Positions update immediately after successful payments</li>
              </ul>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">1. Create Your Account</h3>
                  <p className="text-[#8a8a8a]">Sign up with your email to join BuyTheTop.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">2. Customize Your Profile</h3>
                  <p className="text-[#8a8a8a]">Add your name, description, and avatar to personalize your presence.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">3. Make Your First Contribution</h3>
                  <p className="text-[#8a8a8a]">Contribute at least 1,00 € to enter the ranking.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">4. Climb the Ranks</h3>
                  <p className="text-[#8a8a8a]">Add more capital to improve your position and overtake others.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Coins className="mr-2 h-6 w-6" />
                Payments & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Payment Methods</h3>
                  <p className="text-[#8a8a8a]">
                    We accept all major credit cards through our secure payment processor.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Security</h3>
                  <p className="text-[#8a8a8a]">
                    All payments are processed securely. We never store your payment information.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Refunds</h3>
                  <p className="text-[#8a8a8a]">
                    <strong className="text-red-400">All contributions are final and absolutely non-refundable under any circumstances.</strong> 
                    By registering, you waive your EU consumer rights to withdrawal and refunds. 
                    No refunds will be processed for any reason including dissatisfaction, technical issues, or ranking changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <HelpCircle className="mr-2 h-6 w-6" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Can I change my display name?</h3>
                  <p className="text-[#8a8a8a]">
                    Yes, you can update your profile information at any time from your profile page.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">What happens if someone matches my contribution?</h3>
                  <p className="text-[#8a8a8a]">
                    If contributions are equal, the person who contributed later will rank lower.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Can I see who overtook me?</h3>
                  <p className="text-[#8a8a8a]">Yes, your profile page shows recent overtakes and position changes.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-[#c9a96e]">Is there a maximum contribution limit?</h3>
                  <p className="text-[#8a8a8a]">
                    No, there&apos;s no maximum limit. Contribute as much as you want to secure your position.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Need More Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-[#8a8a8a] mb-4">
                If you have questions not covered here, feel free to reach out to our support team.
              </p>
              <Link href="/contact">
                <Button className="bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
