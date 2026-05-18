import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Cookie, Eye, Lock } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

export const runtime = 'edge'

// Generar metadata estática
export const metadata: Metadata = {
  title: "Privacy Policy & Legal Notice - BuyTheTop",
  description: "Read our privacy policy, cookie policy and legal notice. Learn how we protect your data and comply with GDPR regulations.",
  keywords: ["privacy policy", "legal notice", "cookies", "GDPR", "data protection", "legal"],
  openGraph: {
    title: "Privacy Policy & Legal Notice - BuyTheTop",
    description: "Read our privacy policy, cookie policy and legal notice for BuyTheTop platform.",
    type: "website",
  },
  alternates: {
    canonical: "/privacy",
  },
}

const LAST_UPDATED = "September 1, 2025"

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Privacy Policy & Legal Notice</h1>
          <p className="text-xl text-[#8a8a8a]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8">
          {/* Privacy Policy */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-[#e5e5e5]">
              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">1. Information We Collect</h2>
                <div className="space-y-2 text-[#8a8a8a]">
                  <p><strong>Personal Information:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Email address (for account creation and authentication)</li>
                    <li>• Display name and profile information (voluntarily provided)</li>
                    <li>• Avatar/profile picture (voluntarily provided)</li>
                    <li>• Payment information (processed securely through Stripe)</li>
                  </ul>
                  <p><strong>Usage Data:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Contribution amounts and timestamps</li>
                    <li>• Ranking positions and changes</li>
                    <li>• Platform usage analytics (via Google Analytics)</li>
                    <li>• IP address and browser information</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">2. How We Use Your Information</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• To provide and maintain the BuyTheTop ranking service</li>
                  <li>• To process payments and update rankings</li>
                  <li>• To communicate with you about your account and platform updates</li>
                  <li>• To improve our platform and user experience</li>
                  <li>• To comply with legal obligations</li>
                  <li>• To prevent fraud and ensure platform security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">3. Information Sharing</h2>
                <div className="space-y-2 text-[#8a8a8a]">
                  <p><strong>Public Information:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Your display name, avatar, and ranking position are public</li>
                    <li>• Your total contribution amount is publicly visible</li>
                    <li>• Your profile description (if provided) is public</li>
                  </ul>
                  <p><strong>Third-Party Services:</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• Stripe (for payment processing)</li>
                    <li>• Google Analytics (for usage analytics)</li>
                    <li>• Supabase (for data storage and authentication)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">4. Your Rights (GDPR)</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• <strong>Access:</strong> Request a copy of your personal data</li>
                  <li>• <strong>Rectification:</strong> Correct inaccurate personal data</li>
                  <li>• <strong>Erasure:</strong> Request deletion of your personal data (subject to legitimate interests)</li>
                  <li>• <strong>Portability:</strong> Receive your data in a structured format</li>
                  <li>• <strong>Objection:</strong> Object to processing based on legitimate interests</li>
                  <li>• <strong>Restriction:</strong> Request restriction of processing</li>
                </ul>
                <p className="text-sm text-yellow-400 mt-2">
                  Note: Some rights may be limited due to the public nature of rankings and contribution data.
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Cookie Policy */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Cookie className="mr-2 h-6 w-6" />
                Cookie Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-[#e5e5e5]">
              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">1. Essential Cookies</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• <strong>Authentication:</strong> To keep you logged in and secure your session</li>
                  <li>• <strong>Security:</strong> CSRF protection and security measures</li>
                  <li>• <strong>Functionality:</strong> To remember your preferences and settings</li>
                </ul>
                <p className="text-sm text-[#8a8a8a] mt-2">
                  These cookies are necessary for the platform to function and cannot be disabled.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">2. Analytics Cookies</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• <strong>Google Analytics:</strong> To understand how users interact with our platform</li>
                  <li>• <strong>Performance:</strong> To monitor platform performance and errors</li>
                  <li>• <strong>Usage:</strong> To analyze user behavior and improve our services</li>
                </ul>
                <p className="text-sm text-[#8a8a8a] mt-2">
                  You can opt-out of analytics cookies through our cookie banner.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">3. Payment Cookies</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• <strong>Stripe:</strong> Secure payment processing and fraud prevention</li>
                  <li>• <strong>Session:</strong> To maintain payment session state</li>
                </ul>
                <p className="text-sm text-[#8a8a8a] mt-2">
                  These cookies are essential for processing payments securely.
                </p>
              </section>
            </CardContent>
          </Card>

          {/* Legal Notice */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Eye className="mr-2 h-6 w-6" />
                Legal Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-[#e5e5e5]">
              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">Platform Information</h2>
                <div className="space-y-2 text-[#8a8a8a]">
                  <p><strong>Service:</strong> BuyTheTop - Monetary Ranking Platform</p>
                  <p><strong>Nature:</strong> Digital ranking system based on voluntary monetary contributions</p>
                  <p><strong>Jurisdiction:</strong> European Union</p>
                  <p><strong>Data Controller:</strong> BuyTheTop Platform</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">Content Moderation and Community Standards</h2>
                <div className="space-y-3 text-[#8a8a8a]">
                  <p>
                    We maintain a safe and respectful environment for all users. We reserve the right to moderate, 
                    modify, or remove any content that violates our community standards.
                  </p>
                  <div className="bg-[#2a1f1f] border border-[#4a2f2f] rounded-lg p-4">
                    <p className="text-orange-400 mb-2">
                      <strong>⚠️ Prohibited Content Policy:</strong>
                    </p>
                    <p className="text-[#8a8a8a]">
                      We do not tolerate content related to illegal substances, sexual content, hate speech, 
                      violence, harassment, misinformation, or any other harmful material. Violations may result 
                      in content removal, warnings, or account suspension/bans.
                    </p>
                  </div>
                  <p>
                    For detailed information about our community standards, please review our{" "}
                    <Link href="/terms" className="text-[#c9a96e] hover:underline">
                      Terms & Conditions
                    </Link>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">Important Disclaimers</h2>
                <ul className="space-y-2 text-[#8a8a8a]">
                  <li>• This platform is for entertainment and ranking purposes only</li>
                  <li>• Contributions are voluntary and non-refundable</li>
                  <li>• Rankings are based solely on contribution amounts</li>
                  <li>• We do not guarantee any returns or benefits from contributions</li>
                  <li>• The platform is provided "as is" without warranties</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">Data Security</h2>
                <div className="flex items-start gap-3 p-4 bg-[#2a2a2a] rounded-lg">
                  <Lock className="h-5 w-5 text-[#c9a96e] mt-0.5 flex-shrink-0" />
                  <div className="text-[#8a8a8a]">
                    <p>We implement industry-standard security measures to protect your data:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• SSL/TLS encryption for all data transmission</li>
                      <li>• Secure payment processing via Stripe</li>
                      <li>• Regular security audits and updates</li>
                      <li>• Access controls and authentication measures</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">Contact Information</h2>
                <p className="text-[#8a8a8a]">
                  For privacy-related questions, data requests, or legal inquiries, please contact us through our 
                  <Link href="/contact" className="text-[#c9a96e] hover:underline ml-1">support system</Link>.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
