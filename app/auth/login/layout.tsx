import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - BuyTheTop",
  description: "Log in to your BuyTheTop account to access your profile, view rankings, and make contributions to climb the leaderboard.",
  robots: {
    index: false, // No indexar páginas de login
    follow: true,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
