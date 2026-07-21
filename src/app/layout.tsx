import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: "GroomingPro — Smart Pet Grooming Management",
    template: "%s | GroomingPro",
  },
  description:
    "AI-powered pet grooming salon SaaS. Smart scheduling, customer CRM, online booking, automated marketing. Try free today.",
  keywords: [
    "pet grooming software",
    "grooming salon management",
    "dog grooming booking",
    "pet salon SaaS",
    "AI scheduling",
    "grooming business tools",
  ],
  metadataBase: new URL("https://petsalonos.com"),
  openGraph: {
    title: "GroomingPro — Smart Pet Grooming Management",
    description:
      "AI-powered pet grooming salon SaaS. Bookings, CRM, marketing — all in one place.",
    url: "https://petsalonos.com",
    siteName: "GroomingPro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GroomingPro — Smart Pet Grooming Management",
    description:
      "AI-powered pet grooming salon SaaS. Bookings, CRM, marketing — all in one place.",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="GroomingPro" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
