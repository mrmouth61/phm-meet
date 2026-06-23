"use client"

import type { EventType } from "@/lib/booking-api"
import { BookingWizard } from "@/components/BookingWizard"

interface SlugBookingClientProps {
  preselectedEventType: EventType
}

export function SlugBookingClient({ preselectedEventType }: SlugBookingClientProps) {
  return (
    <BookingWizard
      slugMode
      preselectedEventType={preselectedEventType}
      initialEventTypes={[preselectedEventType]}
    />
  )
}
