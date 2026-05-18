import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, MessageCircle, Clock, Shield } from "lucide-react"
import Link from "next/link"
import { Metadata } from "next"
import { ContactSupport, SupportEmail } from "@/components/contact-support"

export const runtime = 'edge'

// Generar metadata estática
export const metadata: Metadata = {
  title: "Contact - BuyTheTop",
  description: "Get in touch with the BuyTheTop support team. We're here to help you with any questions about the ranking platform.",
  keywords: ["contact", "support", "help", "inquiries", "customer service", "BuyTheTop"],
  openGraph: {
    title: "Contact - BuyTheTop",
    description: "Get in touch with the BuyTheTop support team.",
    type: "website",
  },
  alternates: {
    canonical: "/contact",
  },
}

export default function ContactPage() {
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
          <h1 className="text-4xl font-bold text-[#c9a96e] mb-4 font-serif">Contact</h1>
          <p className="text-xl text-[#8a8a8a]">We're here to help</p>
        </div>

        <div className="space-y-8">
          {/* Información de contacto principal */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Mail className="mr-2 h-6 w-6" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-[#8a8a8a] mb-6">
                  Our support team is ready to help you with any questions about BuyTheTop.
                  You can contact us directly via email or use our contact form.
                </p>
                
                {/* Email de contacto directo */}
                <SupportEmail className="mb-6" />
                
                {/* Botón de acción */}
                <div className="flex justify-center">
                  <ContactSupport 
                    triggerComponent={
                      <Button className="bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Open Contact Form
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de respuesta */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Clock className="mr-2 h-6 w-6" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#c9a96e]">General Inquiries</h3>
                  <p className="text-[#8a8a8a]">
                    We respond to general questions about the platform, functionality, and accounts within 24-48 hours.
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#c9a96e]">Technical Issues</h3>
                  <p className="text-[#8a8a8a]">
                    Technical problems and payment issues are handled with priority, usually within 24 hours.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preguntas frecuentes enlace */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-[#c9a96e] flex items-center">
                <Shield className="mr-2 h-6 w-6" />
                Before Contacting Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[#e5e5e5]">
              <p className="text-[#8a8a8a] mb-4">
                Many common questions can be quickly resolved by checking our help section.
              </p>
              
              <div className="flex justify-center">
                <Link href="/help">
                  <Button className="bg-[#c9a96e] hover:bg-[#b8956a] text-[#0a0a0a] font-medium">
                    View FAQ
                  </Button>
                </Link>
              </div>
              
              <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
                <h4 className="text-[#c9a96e] font-semibold mb-2">Types of inquiries we handle:</h4>
                <ul className="space-y-1 text-[#8a8a8a]">
                  <li>• Payment or contribution issues</li>
                  <li>• Questions about ranking functionality</li>
                  <li>• Technical problems with the platform</li>
                  <li>• Account and profile inquiries</li>
                  <li>• Bug reports or improvement suggestions</li>
                  <li>• Any other general questions</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
