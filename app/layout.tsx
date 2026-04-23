import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Termin buchen | PHM – die Finanzmanufaktur',
  description: 'Vereinbare deinen Beratungstermin mit Thilo Mund – PHM – die Finanzmanufaktur, Bonn.',
  icons: {
    icon: '/logos/PHM_logo_white_transp_horizontal.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
