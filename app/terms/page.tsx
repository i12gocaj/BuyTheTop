import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"

export const runtime = 'edge'

// Generar metadata estática
export const metadata: Metadata = {
  title: "Terms & Conditions - BuyTheTop",
  description: "Read the terms and conditions for using BuyTheTop ranking platform. Understand our policies, user agreements, and platform rules.",
  keywords: ["terms", "conditions", "policy", "agreement", "legal", "platform rules"],
  openGraph: {
    title: "Terms & Conditions - BuyTheTop",
    description: "Read the terms and conditions for using BuyTheTop ranking platform.",
    type: "website",
  },
  alternates: {
    canonical: "/terms",
  },
}

const LAST_UPDATED = "September 1, 2025"

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Terms & Conditions</h1>
          <p className="text-xl text-[#8a8a8a]">Last updated: {LAST_UPDATED}</p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
              <FileText className="mr-2 h-6 w-6" />
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-[#e5e5e5]">
            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">1. Acceptance of Terms</h2>
              <p className="text-[#8a8a8a]">
                By accessing and using the BuyTheTop platform, you accept and agree to be bound by the terms and
                provision of this agreement. <strong className="text-red-400">By proceeding with registration and making any contribution, you acknowledge and expressly agree that you waive your right to withdrawal and refunds under EU consumer protection laws, including the 14-day cooling-off period provided by EU Directive 2011/83/EU.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">2. Description of Service</h2>
              <p className="text-[#8a8a8a]">
                BuyTheTop is a monetary ranking platform where users can make contributions to secure and improve their
                position in a public ranking system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">3. User Responsibilities</h2>
              <ul className="space-y-2 text-[#8a8a8a]">
                <li>• You must provide accurate and complete information when creating your account</li>
                <li>• You are responsible for maintaining the confidentiality of your account</li>
                <li>• You agree not to use the service for any unlawful purposes</li>
                <li>• You understand that all contributions are voluntary and non-refundable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">4. Prohibited Content and Content Moderation</h2>
              <div className="space-y-4 text-[#8a8a8a]">
                <p>
                  <strong className="text-[#c9a96e]">We reserve the right to moderate, modify, or remove any content that violates our policies.</strong> 
                  In cases of repeated violations, we may suspend or permanently ban users from the platform.
                </p>
                
                <div>
                  <h3 className="text-lg font-semibold text-[#c9a96e] mb-2">Prohibited Content includes, but is not limited to:</h3>
                  <ul className="space-y-2 ml-4">
                    <li>• <strong>Illegal substances:</strong> Content promoting or referencing illegal drugs, controlled substances, or drug-related activities</li>
                    <li>• <strong>Sexual content:</strong> Pornographic, sexually explicit, or adult content of any kind</li>
                    <li>• <strong>Hate speech:</strong> Content that promotes discrimination, harassment, or violence based on race, religion, gender, sexual orientation, or other protected characteristics</li>
                    <li>• <strong>Violence and threats:</strong> Content that promotes, incites, or glorifies violence, terrorism, or harm to individuals or groups</li>
                    <li>• <strong>Illegal activities:</strong> Content that promotes or facilitates illegal activities, fraud, or criminal behavior</li>
                    <li>• <strong>Harassment and abuse:</strong> Content that targets, bullies, or harasses other users or individuals</li>
                    <li>• <strong>Misinformation:</strong> Deliberately false or misleading information that could cause harm</li>
                    <li>• <strong>Spam and scams:</strong> Repetitive, promotional, or fraudulent content</li>
                    <li>• <strong>Copyright infringement:</strong> Content that violates intellectual property rights</li>
                    <li>• <strong>Privacy violations:</strong> Content that shares personal information of others without consent</li>
                  </ul>
                </div>
                
                <div className="bg-[#2a1f1f] border border-[#4a2f2f] rounded-lg p-4">
                  <p className="text-orange-400">
                    <strong>⚠️ Content Moderation Policy:</strong> We employ both automated systems and human moderators to monitor content. 
                    Violations may result in immediate content removal, account warnings, temporary suspension, or permanent bans depending on severity and frequency.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">5. Contributions and Payments</h2>
              <ul className="space-y-2 text-[#8a8a8a]">
                <li>• All contributions must be made in Euros (EUR)</li>
                <li>• Minimum contribution amount is 1,00 €</li>
                <li>• <strong className="text-red-400">Contributions are final and absolutely non-refundable under any circumstances</strong></li>
                <li>• <strong className="text-red-400">By registering and making contributions, you expressly waive your right to withdrawal and refunds under EU Directive 2011/83/EU (Consumer Rights Directive)</strong></li>
                <li>• <strong className="text-red-400">No refunds will be processed for any reason including but not limited to: dissatisfaction, change of mind, technical issues, or ranking changes</strong></li>
                <li>• Rankings are updated immediately upon successful payment</li>
                <li>• We reserve the right to reject contributions that violate our policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">6. Ranking System</h2>
              <ul className="space-y-2 text-[#8a8a8a]">
                <li>• Rankings are determined solely by total contribution amounts</li>
                <li>• In case of equal contributions, later contributors rank lower</li>
                <li>• Rankings are public and visible to all users</li>
                <li>• We reserve the right to modify ranking algorithms with notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">7. Privacy and Data</h2>
              <p className="text-[#8a8a8a]">
                We collect and process personal data in accordance with our Privacy Policy. Your ranking position and
                contribution amounts are public information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">8. Limitation of Liability</h2>
              <p className="text-[#8a8a8a]">
                The BuyTheTop platform is provided &quot;as is&quot; without warranties. We are not liable for any damages arising
                from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">9. Changes to Terms</h2>
              <p className="text-[#8a8a8a]">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes
                via email or platform notifications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#c9a96e] mb-3">10. Contact Information</h2>
              <p className="text-[#8a8a8a]">
                For questions about these terms, please contact our support team through the platform.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
