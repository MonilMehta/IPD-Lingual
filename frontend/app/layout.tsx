import type React from "react"
import type { Metadata } from "next"
import { Mona_Sans as FontSans } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Lingual - Language Learning App",
  description: "Learn languages through real-world interaction with Lingual",
  keywords: ["language learning", "translation", "education", "language app", "learning platform"],
  authors: [{ name: "Lingual Team" }],
  creator: "Lingual",
  publisher: "Lingual",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://lingual.vercel.app'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
    other: {
      rel: 'apple-touch-icon',
      url: '/logo.png',
    },
  },
  openGraph: {
    title: "Lingual - Language Learning App",
    description: "Learn languages through real-world interaction with Lingual",
    url: 'https://lingual.vercel.app',
    siteName: 'Lingual',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Lingual Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lingual - Language Learning App',
    description: 'Learn languages through real-world interaction with Lingual',
    creator: '@MonilMehta',
    images: ['/logo.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>{children}</body>
    </html>
  )
}
