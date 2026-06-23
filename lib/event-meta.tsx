"use client"

import {
  Handshake,
  BarChart3,
  MessageCircle,
  Phone,
  Check,
  Calendar,
} from "lucide-react"
import type { ApiEventType, EventType } from "./booking-api"

export function getEventMeta(slug: string): { icon: React.ReactNode; label: string } {
  const map: Record<string, { icon: React.ReactNode; label: string }> = {
    erstgespraech: {
      icon: <Handshake className="w-5 h-5" strokeWidth={1.5} />,
      label: "KENNENLERNEN",
    },
    service: {
      icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
      label: "MANDANTEN",
    },
    telefon: {
      icon: <Phone className="w-5 h-5" strokeWidth={1.5} />,
      label: "DIALOG",
    },
    zweitgespraech: {
      icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
      label: "ANALYSE",
    },
    drittgespraech: {
      icon: <Handshake className="w-5 h-5" strokeWidth={1.5} />,
      label: "STRATEGIE",
    },
    umsetzung: {
      icon: <Check className="w-5 h-5" strokeWidth={1.5} />,
      label: "ONBOARDING",
    },
    vertiefung: {
      icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
      label: "VERTIEFUNG",
    },
  }
  return (
    map[slug] ?? {
      icon: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
      label: "TERMIN",
    }
  )
}

export function mapApiToEventType(et: ApiEventType): EventType {
  return {
    slug: et.slug,
    title: et.title,
    duration: et.duration_minutes,
    description: et.description ?? "",
    url_slug: et.url_slug,
    show_on_homepage: et.show_on_homepage,
    active: et.active,
    ...getEventMeta(et.slug),
  }
}
