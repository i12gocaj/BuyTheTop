import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contribute - BuyTheTop",
  description: "Make your contribution to climb the rankings on BuyTheTop. Secure payments, instant ranking updates, and compete for the top position.",
  keywords: ["contribute", "payment", "ranking", "climb rankings", "leaderboard", "premium platform"],
  openGraph: {
    title: "Contribute - BuyTheTop",
    description: "Make your contribution to climb the rankings on BuyTheTop. Secure payments and instant ranking updates.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
