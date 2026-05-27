import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'PayFlow', template: '%s | PayFlow' },
  description: 'Production-grade fintech payment infrastructure platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background min-h-screen overflow-x-hidden">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
