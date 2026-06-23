"use client"

import type { ApiEventType } from "@/lib/booking-api"
import { mapApiToEventType } from "@/lib/event-meta"
import { BookingWizard } from "@/components/BookingWizard"

interface SlugBookingClientProps {
  eventType: ApiEventType
}

export function SlugBookingClient({ eventType }: SlugBookingClientProps) {
  const mapped = mapApiToEventType(eventType)

  return (
    <BookingWizard
      slugMode
      preselectedEventType={mapped}
      initialEventTypes={[mapped]}
    />
  )
}
