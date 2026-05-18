import { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Profile - BuyTheTop",
  description: "Manage your profile, view your ranking position, track your contributions, and monitor your progress on BuyTheTop platform.",
  robots: {
    index: false, // La página de perfil no debe ser indexada ya que es privada
    follow: false,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
