import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - BuyTheTop",
  description: "Create your BuyTheTop account and join the elite ranking platform. Start climbing the leaderboard and compete for the top position.",
  keywords: ["sign up", "register", "create account", "join", "ranking platform"],
  robots: {
    index: true,
    follow: true,
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
