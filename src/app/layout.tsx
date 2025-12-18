import type { Metadata } from 'next'
import { Roboto_Flex } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const robotoFlex = Roboto_Flex({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AI Chat Message Visualizer',
  description: 'AI Chat Message Visualizer',
  icons: {
    icon: [
      {
        url: '/favicon-32x32.png',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${robotoFlex.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
