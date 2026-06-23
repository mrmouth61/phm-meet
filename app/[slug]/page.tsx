import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  fetchEventTypesServer,
  matchEventTypeBySlug,
  RESERVED_SLUGS,
  type ApiEventType,
} from "@/lib/booking-api"
import { SlugBookingClient } from "./SlugBookingClient"
import { UnavailableEventType } from "./UnavailableEventType"

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
  }
}

interface SlugPageProps {
  params: { slug: string }
}

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = params

  if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
    notFound()
  }

  let types
  try {
    types = await fetchEventTypesServer(true)
  } catch {
    notFound()
  }

  const matched = matchEventTypeBySlug(types, slug)
  if (!matched) {
    notFound()
  }

  if (matched.active === false) {
    return <UnavailableEventType title={matched.title} />
  }

  return <SlugBookingClient eventType={matched as ApiEventType} />
}
