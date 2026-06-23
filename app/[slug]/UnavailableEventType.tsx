import Link from "next/link"
import { Mail } from "lucide-react"

interface UnavailableEventTypeProps {
  title?: string
}

export function UnavailableEventType({ title }: UnavailableEventTypeProps) {
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col">
      <header className="bg-[#083256] border-b-4 border-[#B59B54]">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <Link href="/">
            <img
              src="/logos/PHM_logo_white_transp_horizontal.svg"
              alt="PHM – die Finanzmanufaktur"
              className="h-10 sm:h-12"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#083256] mb-4">
          {title ? title : "Terminart"}
        </h1>
        <p className="text-[#6B7280] leading-relaxed mb-8">
          Diese Terminart ist aktuell nicht verfügbar. Kontaktiere uns gerne direkt — wir finden
          gemeinsam einen passenden Termin.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-[#083256] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#0a4170] transition-all"
          >
            Zur Startseite
          </Link>
          <a
            href="mailto:info@phm-bonn.de"
            className="px-8 py-4 border border-[#B59B54] text-[#083256] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#F5F0E6] transition-all inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" strokeWidth={1.5} />
            info@phm-bonn.de
          </a>
        </div>
      </main>
    </div>
  )
}
