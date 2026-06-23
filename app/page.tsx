"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Handshake,
  BarChart3,
  MessageCircle,
  Phone,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Clock,
  UserPlus,
  X,
  Video,
  ArrowRight,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// API Config
// ============================================

// ============================================
// Types
// ============================================

interface ApiEventType {
  slug: string
  title: string
  description: string
  duration_minutes: number
  color?: string
}

interface EventType {
  slug: string
  title: string
  duration: number
  description: string
  icon: React.ReactNode
  label: string
}

interface ApiSlot {
  start: string
  end: string
}

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface BookingResponse {
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

// ============================================
// Icon & Label Mapping
// ============================================

function getEventMeta(slug: string): { icon: React.ReactNode; label: string } {
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

// ============================================
// API Functions
// ============================================

async function fetchEventTypes(): Promise<EventType[]> {
  const res = await fetch(`/api/event-types`)
  if (!res.ok) throw new Error(`Event Types Fehler: ${res.status}`)
  const data = await res.json()
  const raw = data.eventTypes
  const apiTypes: ApiEventType[] = Array.isArray(raw) ? raw : raw ? [raw] : []
  return apiTypes.map((et) => ({
    slug: et.slug,
    title: et.title,
    duration: et.duration_minutes,
    description: et.description ?? "",
    ...getEventMeta(et.slug),
  }))
}

async function fetchSlots(slug: string, date: string): Promise<ApiSlot[]> {
  const url = `/api/slots?eventType=${slug}&date=${date}&range=week`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Slots Fehler: ${res.status}`)
  const data = await res.json()
  return data.slots ?? []
}

async function bookAppointment(payload: {
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

// ============================================
// Utility Functions
// ============================================

function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = []
  const d = new Date(startDate)
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push(day)
  }
  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const formatDate = (d: Date) =>
  d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })

const formatTime = (d: Date) =>
  d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })

const formatFullDate = (d: Date) =>
  d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

// ============================================
// Components
// ============================================

function Logo() {
  const [imgError, setImgError] = useState(false)

  if (!imgError) {
    return (
      <a href="https://diefinanzmanufaktur.de" className="block">
        <img
          src="/logos/PHM_logo_white_transp_horizontal.svg"
          alt="PHM – die Finanzmanufaktur"
          className="h-10 sm:h-12"
          onError={() => setImgError(true)}
        />
      </a>
    )
  }

  return (
    <a href="https://diefinanzmanufaktur.de" className="flex items-center gap-3">
      <div className="flex items-center gap-[2px]">
        {["P", "H", "M"].map((letter) => (
          <div key={letter} className="w-9 h-9 bg-[#F8F7F4] flex items-center justify-center">
            <span className="font-serif text-sm font-bold text-[#083256]">{letter}</span>
          </div>
        ))}
      </div>
      <div className="hidden sm:block border-l border-[#B59B54]/30 pl-3 ml-1">
        <div className="text-[9px] tracking-[0.25em] uppercase leading-none text-[#B59B54]/70">DIE</div>
        <div className="text-[11px] tracking-[0.15em] uppercase font-medium leading-tight text-[#F8F7F4]">
          FINANZMANUFAKTUR
        </div>
      </div>
    </a>
  )
}

function ProgressIndicator({
  currentStep,
  onStepClick,
}: {
  currentStep: number
  onStepClick: (step: number) => void
}) {
  const steps = [
    { num: 1, label: "Terminart" },
    { num: 2, label: "Datum & Zeit" },
    { num: 3, label: "Kontakt" },
  ]

  return (
    <div className="sticky top-0 z-50 bg-[#F8F7F4] py-4 -mx-6 px-6 border-b border-[#E8E4DF]/50 mb-8">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, i) => {
          const isCompleted = currentStep > step.num
          const isCurrent = currentStep === step.num
          const isClickable = isCompleted || isCurrent

          return (
            <div key={step.num} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.num)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center transition-all duration-200",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center font-mono text-sm transition-all duration-300",
                    isCompleted
                      ? "bg-[#B59B54] text-white hover:bg-[#a08847]"
                      : isCurrent
                      ? "bg-[#083256] text-white"
                      : "bg-[#E8E4DF] text-[#6B7280]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    String(step.num).padStart(2, "0")
                  )}
                </div>
                <span
                  className={cn(
                    "text-[9px] tracking-[0.15em] uppercase mt-2 font-medium transition-colors",
                    currentStep >= step.num ? "text-[#083256]" : "text-[#6B7280]"
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-12 h-[2px] mx-3 mb-5 transition-all duration-300",
                    currentStep > step.num ? "bg-[#B59B54]" : "bg-[#E8E4DF]"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EventTypeCard({
  event,
  isSelected,
  onClick,
}: {
  event: EventType
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full text-left transition-all duration-300 group",
        isSelected ? "transform scale-[1.02]" : "hover:transform hover:scale-[1.01]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-all duration-300",
          isSelected
            ? "bg-[#083256] shadow-xl shadow-[#083256]/20"
            : "bg-white border border-[#E8E4DF] group-hover:border-[#B59B54]"
        )}
      />
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
          isSelected ? "bg-[#B59B54]" : "bg-transparent group-hover:bg-[#B59B54]"
        )}
      />
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium tracking-[0.25em] uppercase mb-2 text-[#B59B54]">
              {event.label}
            </div>
            <h3
              className={cn(
                "font-serif text-lg font-medium mb-3 leading-snug transition-colors",
                isSelected ? "text-white" : "text-[#083256]"
              )}
            >
              {event.title}
            </h3>
            <p
              className={cn(
                "text-sm leading-relaxed transition-colors",
                isSelected ? "text-white/70" : "text-[#6B7280]"
              )}
            >
              {event.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <div
              className={cn(
                "w-12 h-12 flex items-center justify-center transition-all duration-300",
                isSelected
                  ? "bg-[#B59B54] text-white"
                  : "bg-[#083256] text-white group-hover:bg-[#B59B54]"
              )}
            >
              {event.icon}
            </div>
            <span
              className={cn(
                "font-mono text-xs transition-colors",
                isSelected ? "text-[#B59B54]" : "text-[#6B7280]"
              )}
            >
              {event.duration} Min
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function CalendarView({
  selectedDate,
  onDateSelect,
  weekStart,
  onWeekChange,
}: {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  weekStart: Date
  onWeekChange: (date: Date) => void
}) {
  const days = getWeekDays(weekStart)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const canGoPrev = (() => {
    const prev = new Date(weekStart)
    prev.setDate(prev.getDate() - 7)
    return prev >= today
  })()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            const prev = new Date(weekStart)
            prev.setDate(prev.getDate() - 7)
            if (prev >= today) onWeekChange(prev)
          }}
          disabled={!canGoPrev}
          className={cn(
            "w-11 h-11 flex items-center justify-center transition-all duration-200",
            canGoPrev
              ? "bg-[#083256] text-white hover:bg-[#0a4170] cursor-pointer"
              : "bg-[#E8E4DF] text-[#6B7280]/50 cursor-not-allowed"
          )}
          aria-label="Vorherige Woche"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="text-center">
          <span className="font-serif text-xl text-[#083256]">
            {days[0].toLocaleDateString("de-DE", { month: "long" })}
          </span>
          <span className="text-[#B59B54] font-mono text-sm ml-2">{days[0].getFullYear()}</span>
        </div>

        <button
          onClick={() => {
            const next = new Date(weekStart)
            next.setDate(next.getDate() + 7)
            onWeekChange(next)
          }}
          className="w-11 h-11 bg-[#083256] flex items-center justify-center text-white hover:bg-[#0a4170] transition-all duration-200"
          aria-label="Nächste Woche"
        >
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {days.map((day) => {
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
          const isPast = day < today
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              disabled={isPast}
              onClick={() => !isPast && onDateSelect(day)}
              className={cn(
                "relative py-5 px-2 transition-all duration-200 text-center group",
                isSelected
                  ? "bg-[#083256] text-white shadow-lg shadow-[#083256]/20"
                  : isPast
                  ? "bg-[#F5F0E6] text-[#6B7280]/30 cursor-not-allowed"
                  : "bg-white border border-[#E8E4DF] text-[#083256] hover:border-[#B59B54] hover:shadow-md cursor-pointer"
              )}
            >
              {isToday && !isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-[#B59B54]" />
              )}
              <div
                className={cn(
                  "text-[10px] uppercase tracking-wider mb-2 font-medium",
                  isSelected ? "text-[#B59B54]" : isPast ? "text-[#6B7280]/30" : "text-[#6B7280]"
                )}
              >
                {day.toLocaleDateString("de-DE", { weekday: "short" })}
              </div>
              <div className={cn("font-serif text-3xl font-medium", isPast && "opacity-30")}>
                {day.getDate()}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeSlots({
  slots,
  selectedSlot,
  onSelect,
  loading,
}: {
  slots: ApiSlot[]
  selectedSlot: ApiSlot | null
  onSelect: (slot: ApiSlot) => void
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="w-6 h-6 text-[#B59B54] animate-spin mx-auto mb-3" />
        <p className="text-[#6B7280] text-sm">Verfügbare Termine werden geladen…</p>
      </div>
    )
  }

  if (!slots.length) {
    return (
      <div className="py-10 text-center">
        <div className="w-16 h-16 bg-[#F5F0E6] flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
        </div>
        <p className="text-[#6B7280] text-sm">Keine freien Termine an diesem Tag.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
      {slots.map((slot) => {
        const startDate = new Date(slot.start)
        const isSelected = selectedSlot?.start === slot.start

        return (
          <button
            key={slot.start}
            onClick={() => onSelect(slot)}
            className={cn(
              "py-4 px-2 transition-all duration-200 font-mono text-sm",
              isSelected
                ? "bg-[#B59B54] text-white font-medium shadow-lg shadow-[#B59B54]/20"
                : "bg-white border border-[#E8E4DF] text-[#083256] hover:border-[#B59B54] hover:bg-[#F5F0E6]"
            )}
          >
            {formatTime(startDate)}
          </button>
        )
      })}
    </div>
  )
}

function ParticipantForm({
  participant,
  onUpdate,
  onRemove,
  isPrimary = false,
  index,
}: {
  participant: Participant
  onUpdate: (field: keyof Participant, value: string) => void
  onRemove?: () => void
  isPrimary?: boolean
  index: number
}) {
  return (
    <div
      className={cn(
        "relative p-6 animate-fadeIn",
        isPrimary ? "bg-[#083256]" : "bg-white border border-[#E8E4DF]"
      )}
    >
      {!isPrimary && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 px-3 py-1.5 flex items-center gap-2 border border-[#083256] text-[#083256] text-xs font-medium tracking-wide uppercase hover:bg-[#083256] hover:text-white transition-all"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          Entfernen
        </button>
      )}

      <div
        className={cn(
          "text-[10px] font-medium tracking-[0.25em] uppercase mb-5 text-[#B59B54]"
        )}
      >
        {isPrimary ? "Deine Kontaktdaten" : `Weitere Person ${index}`}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(["firstName", "lastName", "email", "phone"] as const).map((field) => {
          const labels: Record<string, string> = {
            firstName: "Vorname",
            lastName: "Nachname",
            email: "E-Mail",
            phone: "Telefon",
          }
          const placeholders: Record<string, string> = {
            firstName: "Max",
            lastName: "Mustermann",
            email: "max@beispiel.de",
            phone: "+49 171 1234567",
          }
          return (
            <div key={field}>
              <label
                className={cn(
                  "block text-[10px] font-medium mb-2 tracking-wide uppercase",
                  isPrimary ? "text-white/70" : "text-[#083256]"
                )}
              >
                {labels[field]} <span className="text-[#B59B54]">*</span>
              </label>
              <input
                type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                value={participant[field]}
                onChange={(e) => onUpdate(field, e.target.value)}
                placeholder={placeholders[field]}
                className={cn(
                  "w-full px-4 py-3 text-sm transition-all focus:outline-none",
                  isPrimary
                    ? "bg-[#0a4170] border border-[#B59B54]/30 text-white placeholder:text-white/40 focus:border-[#B59B54]"
                    : "bg-white border border-[#E8E4DF] text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256]"
                )}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BookingForm({
  selectedEvent,
  selectedSlot,
  onSubmit,
  loading,
  error,
}: {
  selectedEvent: EventType
  selectedSlot: ApiSlot
  onSubmit: (data: { participants: Omit<Participant, "id">[]; notes: string }) => void
  loading: boolean
  error: string | null
}) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "primary", firstName: "", lastName: "", email: "", phone: "" },
  ])
  const [notes, setNotes] = useState("")
  const participantRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const startDate = new Date(selectedSlot.start)

  const addParticipant = () => {
    const newId = crypto.randomUUID()
    setParticipants([
      ...participants,
      { id: newId, firstName: "", lastName: "", email: "", phone: "" },
    ])
    setTimeout(() => {
      const newRef = participantRefs.current.get(newId)
      if (newRef) {
        const offsetPosition = newRef.getBoundingClientRect().top + window.pageYOffset - 140
        window.scrollTo({ top: offsetPosition, behavior: "smooth" })
      }
    }, 100)
  }

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants(participants.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const isValid =
    participants[0].firstName &&
    participants[0].lastName &&
    participants[0].email &&
    participants[0].phone &&
    participants.every(
      (p) => p.id === "primary" || (p.firstName && p.lastName && p.email && p.phone)
    )

  const handleSubmit = () => {
    if (!isValid) return
    const mapped = participants.map(({ id, ...rest }) => rest)
    onSubmit({ participants: mapped, notes })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Booking Summary */}
      <div className="bg-[#F5F0E6] p-6 border-l-4 border-[#B59B54]">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#B59B54] mb-3">
          Dein Termin
        </div>
        <h3 className="font-serif text-base text-[#083256] mb-4">{selectedEvent.title}</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-[#083256]">
            <Calendar className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
            {formatFullDate(startDate)}
          </div>
          <div className="flex items-center gap-2 text-[#083256]">
            <Clock className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
            <span className="font-mono">{formatTime(startDate)} Uhr</span>
          </div>
          <div className="flex items-center gap-2 text-[#083256]">
            <Video className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
            Zoom-Meeting
          </div>
        </div>
      </div>

      {participants.map((participant, index) => (
        <div
          key={participant.id}
          ref={(el) => {
            if (el) participantRefs.current.set(participant.id, el)
            else participantRefs.current.delete(participant.id)
          }}
        >
          <ParticipantForm
            participant={participant}
            onUpdate={(field, value) => updateParticipant(participant.id, field, value)}
            onRemove={index > 0 ? () => removeParticipant(participant.id) : undefined}
            isPrimary={index === 0}
            index={index}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addParticipant}
        className="flex items-center justify-center gap-2 py-4 px-4 border-2 border-dashed border-[#B59B54]/40 text-[#083256] text-sm font-medium hover:border-[#B59B54] hover:bg-[#F5F0E6] transition-all"
      >
        <UserPlus className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
        Weitere Person hinzufügen
      </button>

      <div className="bg-white p-6 border border-[#E8E4DF]">
        <label className="block text-[10px] font-medium tracking-[0.25em] uppercase mb-3 text-[#6B7280]">
          Anmerkungen (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Worüber möchtest du sprechen?"
          rows={3}
          className="w-full px-4 py-3 border border-[#E8E4DF] bg-white text-sm text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256] focus:outline-none transition-all resize-none"
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        className={cn(
          "mt-2 py-5 px-6 text-sm font-semibold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-3",
          isValid && !loading
            ? "bg-[#B59B54] text-white hover:bg-[#a08847] cursor-pointer shadow-lg shadow-[#B59B54]/20"
            : "bg-[#E8E4DF] text-[#6B7280] cursor-not-allowed"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Wird gebucht…
          </>
        ) : (
          <>
            Termin verbindlich buchen
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </>
        )}
      </button>
    </div>
  )
}

function ConfirmationView({
  bookingResponse,
  eventType,
}: {
  bookingResponse: BookingResponse
  eventType: EventType
}) {
  const { booking } = bookingResponse
  const startDate = new Date(booking.start)

  return (
    <div className="animate-slideUp">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#B59B54] flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-white" strokeWidth={1.5} />
        </div>
        <h2 className="font-serif text-4xl sm:text-5xl font-medium text-[#083256] mb-4">
          Termin bestätigt
        </h2>
        <p className="text-[#6B7280] leading-relaxed max-w-md mx-auto">
          Du erhältst in Kürze eine Bestätigung per E-Mail mit allen Details und dem Zoom-Link.
        </p>
      </div>

      {/* Booking Summary */}
      <div className="bg-[#F5F0E6] p-8 mb-8">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#B59B54] mb-6">
          Zusammenfassung
        </div>

        <div className="space-y-5">
          {[
            { icon: <Handshake className="w-5 h-5 text-white" strokeWidth={1.5} />, label: "Terminart", value: eventType.title },
            { icon: <Calendar className="w-5 h-5 text-white" strokeWidth={1.5} />, label: "Datum", value: formatFullDate(startDate) },
            {
              icon: <Clock className="w-5 h-5 text-white" strokeWidth={1.5} />,
              label: "Uhrzeit & Dauer",
              value: `${formatTime(startDate)} Uhr · ${booking.duration} Minuten`,
              mono: true,
            },
            { icon: <Video className="w-5 h-5 text-white" strokeWidth={1.5} />, label: "Ort", value: "Zoom-Videocall (Link folgt per E-Mail)" },
          ].map(({ icon, label, value, mono }) => (
            <div key={label} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                  {label}
                </div>
                <div className={cn("text-sm text-[#083256] font-medium", mono && "font-mono")}>
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={booking.reschedule_url}
          className="px-8 py-4 bg-[#083256] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#0a4170] transition-all text-center"
        >
          Termin verschieben
        </a>
        <a
          href={booking.cancel_url}
          className="px-8 py-4 border border-[#C45B4A] text-sm font-medium text-[#C45B4A] tracking-[0.1em] uppercase hover:bg-[#C45B4A] hover:text-white transition-all text-center"
        >
          Termin absagen
        </a>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function PHMMeet() {
  const [step, setStep] = useState<"select" | "confirmed">("select")

  // Event Types
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loadingEventTypes, setLoadingEventTypes] = useState(true)
  const [errorEventTypes, setErrorEventTypes] = useState<string | null>(null)

  // Selection
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<ApiSlot | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // Slots
  const [allSlots, setAllSlots] = useState<ApiSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errorSlots, setErrorSlots] = useState<string | null>(null)

  // Booking
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [errorBooking, setErrorBooking] = useState<string | null>(null)

  // Refs
  const step1Ref = useRef<HTMLElement>(null)
  const step2Ref = useRef<HTMLElement>(null)
  const step3Ref = useRef<HTMLElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)

  const currentStep = !selectedEvent ? 1 : !selectedSlot ? 2 : 3

  // Derived: slots for selected day
  const slotsForSelectedDay: ApiSlot[] = selectedDate
    ? allSlots.filter((s) => isSameDay(new Date(s.start), selectedDate))
    : []

  // Scroll helper
  const scrollToSection = useCallback((ref: React.RefObject<HTMLElement | null>, offset = 140) => {
    if (ref.current) {
      const offsetPosition = ref.current.getBoundingClientRect().top + window.pageYOffset - offset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }, [])

  const handleStepClick = useCallback(
    (stepNum: number) => {
      if (stepNum === 1) scrollToSection(step1Ref)
      if (stepNum === 2 && selectedEvent) scrollToSection(step2Ref)
      if (stepNum === 3 && selectedSlot) scrollToSection(step3Ref)
    },
    [selectedEvent, selectedSlot, scrollToSection]
  )

  // Load event types on mount
  useEffect(() => {
    setLoadingEventTypes(true)
    fetchEventTypes()
      .then(setEventTypes)
      .catch(() => setErrorEventTypes("Terminarten konnten nicht geladen werden."))
      .finally(() => setLoadingEventTypes(false))
  }, [])

  // Load slots when event type or week changes
  useEffect(() => {
    if (!selectedEvent) return
    setLoadingSlots(true)
    setErrorSlots(null)
    setAllSlots([])
    setSelectedSlot(null)

    const dateStr = weekStart.toISOString().split("T")[0]
    fetchSlots(selectedEvent.slug, dateStr)
      .then(setAllSlots)
      .catch(() => setErrorSlots("Verfügbare Termine konnten nicht geladen werden."))
      .finally(() => setLoadingSlots(false))
  }, [selectedEvent, weekStart])

  // Auto-scroll to step 2 when event is selected
  useEffect(() => {
    if (selectedEvent && !selectedSlot) {
      setTimeout(() => scrollToSection(step2Ref), 100)
    }
  }, [selectedEvent, selectedSlot, scrollToSection])

  // Auto-scroll to time slots after date selection
  useEffect(() => {
    if (selectedDate) {
      setTimeout(() => {
        if (timeSlotsRef.current) {
          const offsetPosition =
            timeSlotsRef.current.getBoundingClientRect().top + window.pageYOffset - 140
          window.scrollTo({ top: offsetPosition, behavior: "smooth" })
        }
      }, 150)
    }
  }, [selectedDate])

  // Auto-scroll to step 3 when slot is selected
  useEffect(() => {
    if (selectedSlot) {
      setTimeout(() => scrollToSection(step3Ref), 100)
    }
  }, [selectedSlot, scrollToSection])

  const handleBook = useCallback(
    async (formData: { participants: Omit<Participant, "id">[]; notes: string }) => {
      if (!selectedSlot || !selectedEvent) return

      setLoadingBooking(true)
      setErrorBooking(null)

      try {
        const response = await bookAppointment({
          eventType: selectedEvent.slug,
          slot: selectedSlot.start,
          participants: formData.participants,
          notes: formData.notes,
        })
        setBookingResponse(response)
        setStep("confirmed")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } catch (err) {
        setErrorBooking(
          "Die Buchung konnte leider nicht abgeschlossen werden. Bitte versuche es erneut oder kontaktiere uns direkt."
        )
      } finally {
        setLoadingBooking(false)
      }
    },
    [selectedSlot, selectedEvent]
  )

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Header */}
      <header className="bg-[#083256] border-b-4 border-[#B59B54]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo />
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] tracking-[0.2em] uppercase text-[#B59B54]/70">
                Beratung buchen
              </div>
              <div className="font-serif text-sm text-white">Thilo Mund</div>
            </div>
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        {step === "confirmed" && bookingResponse && selectedEvent ? (
          <ConfirmationView bookingResponse={bookingResponse} eventType={selectedEvent} />
        ) : (
          <>
            {/* Headline */}
            <div className="text-center mb-10 animate-fadeIn">
              <div className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#B59B54] mb-4">
                PHM – DIE FINANZMANUFAKTUR
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#083256] mb-4 leading-tight">
                Vereinbare
                <br />
                <span className="text-[#B59B54]">deinen Termin.</span>
              </h1>
              <p className="text-[#6B7280] max-w-lg mx-auto leading-relaxed">
                Persönliche Beratung mit Thilo Mund. Wähle einen passenden Termin für unser
                Gespräch.
              </p>
            </div>

            {/* Progress */}
            <ProgressIndicator currentStep={currentStep} onStepClick={handleStepClick} />

            {/* Step 1: Event Type */}
            <section ref={step1Ref} id="step-1" className="mb-10 scroll-mt-36">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#083256] flex items-center justify-center">
                  <span className="text-white font-mono text-sm">01</span>
                </div>
                <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[#083256]">
                  Terminart wählen
                </h2>
              </div>

              {loadingEventTypes && (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 text-[#B59B54] animate-spin mx-auto mb-3" />
                  <p className="text-[#6B7280] text-sm">Termine werden geladen…</p>
                </div>
              )}

              {errorEventTypes && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                  <span>{errorEventTypes}</span>
                </div>
              )}

              {!loadingEventTypes && !errorEventTypes && (
                <div className="flex flex-col gap-4">
                  {eventTypes.map((event) => (
                    <EventTypeCard
                      key={event.slug}
                      event={event}
                      isSelected={selectedEvent?.slug === event.slug}
                      onClick={() => {
                        setSelectedEvent(event)
                        setSelectedSlot(null)
                        setSelectedDate(null)
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Step 2: Date & Time */}
            {selectedEvent && (
              <section ref={step2Ref} id="step-2" className="mb-10 animate-fadeIn scroll-mt-36">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#083256] flex items-center justify-center">
                    <span className="text-white font-mono text-sm">02</span>
                  </div>
                  <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[#083256]">
                    Datum & Uhrzeit
                  </h2>
                </div>
                <div className="bg-white border border-[#E8E4DF] p-6 sm:p-8 shadow-sm">
                  <CalendarView
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    weekStart={weekStart}
                    onWeekChange={setWeekStart}
                  />

                  {errorSlots && (
                    <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span>{errorSlots}</span>
                    </div>
                  )}

                  {selectedDate && (
                    <div
                      ref={timeSlotsRef}
                      className="mt-8 pt-8 border-t border-[#E8E4DF] animate-fadeIn"
                    >
                      <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
                        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280]">
                          Verfügbare Zeiten am {formatDate(selectedDate)}
                        </span>
                      </div>
                      <TimeSlots
                        slots={slotsForSelectedDay}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                        loading={loadingSlots}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Step 3: Contact */}
            {selectedSlot && selectedEvent && (
              <section ref={step3Ref} id="step-3" className="animate-fadeIn scroll-mt-36">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-[#083256] flex items-center justify-center">
                    <span className="text-white font-mono text-sm">03</span>
                  </div>
                  <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[#083256]">
                    Deine Kontaktdaten
                  </h2>
                </div>
                <BookingForm
                  selectedEvent={selectedEvent}
                  selectedSlot={selectedSlot}
                  onSubmit={handleBook}
                  loading={loadingBooking}
                  error={errorBooking}
                />
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#083256] mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Logo />
            <div className="text-center sm:text-right flex flex-col gap-2">
              <div className="text-xs text-white/80">
                PHM – die Finanzmanufaktur | Inh. Thilo Mund | info@phm-bonn.de
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-4 text-[10px] text-[#B59B54]/70">
                <a
                  href="https://diefinanzmanufaktur.de/impressum.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B59B54] transition-colors"
                >
                  Impressum
                </a>
                <span>|</span>
                <a
                  href="https://diefinanzmanufaktur.de/datenschutz.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#B59B54] transition-colors"
                >
                  Datenschutz
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
