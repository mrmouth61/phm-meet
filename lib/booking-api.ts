import type { ReactNode } from "react"

export interface ApiEventType {
  slug: string
  title: string
  description: string
  duration_minutes: number
  color?: string
  url_slug?: string | null
  show_on_homepage?: boolean
  active?: boolean
}

export interface EventType {
  slug: string
  title: string
  duration: number
  description: string
  icon: ReactNode
  label: string
  url_slug?: string | null
  show_on_homepage?: boolean
  active?: boolean
}

export interface ApiSlot {
  start: string
  end: string
}

export interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface BookingResponse {
  success: boolean
  booking: {
    id: string
    title: string
    start: string
    end: string
    duration: number
    zoom_url: string
    reschedule_url: string
    cancel_url: string
  }
}

export async function fetchEventTypesFromApi(all = false): Promise<ApiEventType[]> {
  const url = all ? `/api/event-types?all=true` : `/api/event-types`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Event Types Fehler: ${res.status}`)
  const data = await res.json()
  const raw = data.eventTypes
  return Array.isArray(raw) ? raw : raw ? [raw] : []
}

export async function fetchSlots(slug: string, date: string): Promise<ApiSlot[]> {
  const url = `/api/slots?eventType=${slug}&date=${date}&range=week`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Slots Fehler: ${res.status}`)
  const data = await res.json()
  return data.slots ?? []
}

export async function bookAppointment(payload: {
  eventType: string
  slot: string
  participants: Omit<Participant, "id">[]
  notes: string
}): Promise<BookingResponse> {
  const res = await fetch(`/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Buchung fehlgeschlagen: ${res.status}`)
  return res.json()
}

/** Server-side fetch (slug page) — bypasses Next API proxy. */
export async function fetchEventTypesServer(all = false): Promise<ApiEventType[]> {
  const base = process.env.N8N_BASE_URL ?? "https://n8n.phm-bonn.de"
  const url = all
    ? `${base}/webhook/meet-event-types?all=true`
    : `${base}/webhook/meet-event-types`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Event Types Fehler: ${res.status}`)
  const data = await res.json()
  const raw = data.eventTypes
  return Array.isArray(raw) ? raw : raw ? [raw] : []
}

export const RESERVED_SLUGS = ["reschedule", "cancel", "api"] as const

export function matchEventTypeBySlug(
  types: ApiEventType[],
  slug: string
): ApiEventType | undefined {
  return types.find((et) => et.url_slug === slug || et.slug === slug)
}
