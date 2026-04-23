"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Handshake,
  BarChart3,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar,
  Clock,
  UserPlus,
  X,
  Video,
  ArrowRight,
  MapPin
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================
// Types
// ============================================

interface EventType {
  slug: string
  title: string
  duration: number
  description: string
  icon: React.ReactNode
  label: string
}

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface BookingData {
  slot: Date
  participants: Participant[]
  notes: string
}

// ============================================
// Constants
// ============================================

const EVENT_TYPES: EventType[] = [
  {
    slug: "erstgespraech",
    title: "Kennenlernen & Erstgespräch",
    duration: 45,
    description: "Kostenfreies Kennenlerngespräch – wir besprechen deine Situation und schauen, ob und wie ich dir weiterhelfen kann.",
    icon: <Handshake className="w-5 h-5" strokeWidth={1.5} />,
    label: "KENNENLERNEN",
  },
  {
    slug: "statuscheck",
    title: "Status-Check & Optimierung",
    duration: 45,
    description: "Für bestehende Mandanten – gemeinsamer Blick auf deine aktuelle Aufstellung und mögliche Optimierungen.",
    icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
    label: "MANDANTEN",
  },
  {
    slug: "telefon",
    title: "Kurze Rücksprache",
    duration: 15,
    description: "Schnelle Abstimmung zu einer konkreten Frage oder einem laufenden Thema.",
    icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
    label: "DIALOG",
  },
]

// ============================================
// Utility Functions
// ============================================

function generateSlotsUTC(date: Date, duration: number): Date[] {
  const slots: Date[] = []
  const start = 9
  const end = 18
  const d = new Date(date)
  const day = d.getDay()

  if (day === 0 || day === 6) return slots

  for (let h = start; h < end; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h + (m + duration) / 60 > end) continue
      if (Math.random() > 0.45) {
        const utcSlot = new Date(Date.UTC(
          d.getFullYear(),
          d.getMonth(),
          d.getDate(),
          h,
          m,
          0,
          0
        ))
        slots.push(utcSlot)
      }
    }
  }
  return slots
}

function utcToLocal(utcDate: Date): Date {
  return new Date(utcDate.getTime())
}

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

const formatDate = (d: Date) =>
  d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })

const formatTime = (d: Date) =>
  d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })

const formatFullDate = (d: Date) =>
  d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

// ============================================
// Components
// ============================================

function Logo({ variant = "light" }: { variant?: "light" | "dark" }) {
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
          <div
            key={letter}
            className="w-9 h-9 bg-[#F8F7F4] flex items-center justify-center"
          >
            <span className="font-serif text-sm font-bold text-[#083256]">
              {letter}
            </span>
          </div>
        ))}
      </div>
      <div className="hidden sm:block border-l border-[#B59B54]/30 pl-3 ml-1">
        <div className="text-[9px] tracking-[0.25em] uppercase leading-none text-[#B59B54]/70">
          DIE
        </div>
        <div className="text-[11px] tracking-[0.15em] uppercase font-medium leading-tight text-[#F8F7F4]">
          FINANZMANUFAKTUR
        </div>
      </div>
    </a>
  )
}

function ProgressIndicator({
  currentStep,
  onStepClick
}: {
  currentStep: number
  onStepClick: (step: number) => void
}) {
  const steps = [
    { num: 1, label: "Terminart", id: "step-1" },
    { num: 2, label: "Datum & Zeit", id: "step-2" },
    { num: 3, label: "Kontakt", id: "step-3" },
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
                  {isCompleted ? <Check className="w-4 h-4" strokeWidth={1.5} /> : String(step.num).padStart(2, "0")}
                </div>
                <span className={cn(
                  "text-[9px] tracking-[0.15em] uppercase mt-2 font-medium transition-colors",
                  currentStep >= step.num ? "text-[#083256]" : "text-[#6B7280]"
                )}>
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
  onClick
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
        isSelected
          ? "transform scale-[1.02]"
          : "hover:transform hover:scale-[1.01]"
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

      {/* Gold accent line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
        isSelected ? "bg-[#B59B54]" : "bg-transparent group-hover:bg-[#B59B54]"
      )} />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-[10px] font-medium tracking-[0.25em] uppercase mb-2 transition-colors",
              isSelected ? "text-[#B59B54]" : "text-[#B59B54]"
            )}>
              {event.label}
            </div>

            <h3 className={cn(
              "font-serif text-lg font-medium mb-3 leading-snug transition-colors",
              isSelected ? "text-white" : "text-[#083256]"
            )}>
              {event.title}
            </h3>

            <p className={cn(
              "text-sm leading-relaxed transition-colors",
              isSelected ? "text-white/70" : "text-[#6B7280]"
            )}>
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
            <span className={cn(
              "font-mono text-xs transition-colors",
              isSelected ? "text-[#B59B54]" : "text-[#6B7280]"
            )}>
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
  onWeekChange
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
          <span className="text-[#B59B54] font-mono text-sm ml-2">
            {days[0].getFullYear()}
          </span>
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
          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString()
          const isPast = day < today
          const isToday = day.toDateString() === today.toDateString()

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
              <div className={cn(
                "text-[10px] uppercase tracking-wider mb-2 font-medium",
                isSelected ? "text-[#B59B54]" : isPast ? "text-[#6B7280]/30" : "text-[#6B7280]"
              )}>
                {day.toLocaleDateString("de-DE", { weekday: "short" })}
              </div>
              <div className={cn(
                "font-serif text-3xl font-medium",
                isPast && "opacity-30"
              )}>
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
  onSelect
}: {
  slots: Date[]
  selectedSlot: Date | null
  onSelect: (slot: Date) => void
}) {
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
        const localSlot = utcToLocal(slot)
        const isSelected = selectedSlot && slot.getTime() === selectedSlot.getTime()

        return (
          <button
            key={slot.toISOString()}
            onClick={() => onSelect(slot)}
            className={cn(
              "py-4 px-2 transition-all duration-200 font-mono text-sm group",
              isSelected
                ? "bg-[#B59B54] text-white font-medium shadow-lg shadow-[#B59B54]/20"
                : "bg-white border border-[#E8E4DF] text-[#083256] hover:border-[#B59B54] hover:bg-[#F5F0E6]"
            )}
          >
            {formatTime(localSlot)}
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
    <div className={cn(
      "relative p-6 animate-fadeIn",
      isPrimary ? "bg-[#083256]" : "bg-white border border-[#E8E4DF]"
    )}>
      {!isPrimary && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-4 right-4 px-3 py-1.5 flex items-center gap-2 border border-[#083256] text-[#083256] text-xs font-medium tracking-wide uppercase hover:bg-[#083256] hover:text-white transition-all"
          aria-label="Teilnehmer entfernen"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          Entfernen
        </button>
      )}

      <div className={cn(
        "text-[10px] font-medium tracking-[0.25em] uppercase mb-5",
        isPrimary ? "text-[#B59B54]" : "text-[#B59B54]"
      )}>
        {isPrimary ? "Deine Kontaktdaten" : `Weitere Person ${index}`}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={cn(
            "block text-[10px] font-medium mb-2 tracking-wide uppercase",
            isPrimary ? "text-white/70" : "text-[#083256]"
          )}>
            Vorname <span className="text-[#B59B54]">*</span>
          </label>
          <input
            type="text"
            value={participant.firstName}
            onChange={(e) => onUpdate("firstName", e.target.value)}
            placeholder="Max"
            className={cn(
              "w-full px-4 py-3 text-sm transition-all focus:outline-none",
              isPrimary
                ? "bg-[#0a4170] border border-[#B59B54]/30 text-white placeholder:text-white/40 focus:border-[#B59B54]"
                : "bg-white border border-[#E8E4DF] text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256]"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "block text-[10px] font-medium mb-2 tracking-wide uppercase",
            isPrimary ? "text-white/70" : "text-[#083256]"
          )}>
            Nachname <span className="text-[#B59B54]">*</span>
          </label>
          <input
            type="text"
            value={participant.lastName}
            onChange={(e) => onUpdate("lastName", e.target.value)}
            placeholder="Mustermann"
            className={cn(
              "w-full px-4 py-3 text-sm transition-all focus:outline-none",
              isPrimary
                ? "bg-[#0a4170] border border-[#B59B54]/30 text-white placeholder:text-white/40 focus:border-[#B59B54]"
                : "bg-white border border-[#E8E4DF] text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256]"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "block text-[10px] font-medium mb-2 tracking-wide uppercase",
            isPrimary ? "text-white/70" : "text-[#083256]"
          )}>
            E-Mail <span className="text-[#B59B54]">*</span>
          </label>
          <input
            type="email"
            value={participant.email}
            onChange={(e) => onUpdate("email", e.target.value)}
            placeholder="max@beispiel.de"
            className={cn(
              "w-full px-4 py-3 text-sm transition-all focus:outline-none",
              isPrimary
                ? "bg-[#0a4170] border border-[#B59B54]/30 text-white placeholder:text-white/40 focus:border-[#B59B54]"
                : "bg-white border border-[#E8E4DF] text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256]"
            )}
          />
        </div>

        <div>
          <label className={cn(
            "block text-[10px] font-medium mb-2 tracking-wide uppercase",
            isPrimary ? "text-white/70" : "text-[#083256]"
          )}>
            Telefon <span className="text-[#B59B54]">*</span>
          </label>
          <input
            type="tel"
            value={participant.phone}
            onChange={(e) => onUpdate("phone", e.target.value)}
            placeholder="+49 171 1234567"
            className={cn(
              "w-full px-4 py-3 text-sm transition-all focus:outline-none",
              isPrimary
                ? "bg-[#0a4170] border border-[#B59B54]/30 text-white placeholder:text-white/40 focus:border-[#B59B54]"
                : "bg-white border border-[#E8E4DF] text-[#083256] placeholder:text-[#6B7280]/50 focus:border-[#083256]"
            )}
          />
        </div>
      </div>
    </div>
  )
}

function BookingForm({
  selectedEvent,
  selectedSlot,
  onSubmit,
  loading
}: {
  selectedEvent: EventType
  selectedSlot: Date
  onSubmit: (data: { participants: Participant[], notes: string }) => void
  loading: boolean
}) {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "primary", firstName: "", lastName: "", email: "", phone: "" }
  ])
  const [notes, setNotes] = useState("")
  const localSlot = utcToLocal(selectedSlot)
  const participantRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const addParticipant = () => {
    const newId = crypto.randomUUID()
    setParticipants([
      ...participants,
      { id: newId, firstName: "", lastName: "", email: "", phone: "" }
    ])
    // Scroll to new participant after render
    setTimeout(() => {
      const newRef = participantRefs.current.get(newId)
      if (newRef) {
        const elementPosition = newRef.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - 140
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        })
      }
    }, 100)
  }

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants(participants.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  const isValid = participants[0].firstName &&
    participants[0].lastName &&
    participants[0].email &&
    participants[0].phone &&
    participants.every(p =>
      p.id === "primary" || (p.firstName && p.lastName && p.email && p.phone)
    )

  return (
    <div className="flex flex-col gap-4">
      {/* Booking Summary */}
      <div className="bg-[#F5F0E6] p-6 border-l-4 border-[#B59B54]">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#B59B54] mb-3">
          Dein Termin
        </div>
        <h3 className="font-serif text-base text-[#083256] mb-4">
          {selectedEvent.title}
        </h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-[#083256]">
            <Calendar className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
            {formatFullDate(localSlot)}
          </div>
          <div className="flex items-center gap-2 text-[#083256]">
            <Clock className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
            <span className="font-mono">{formatTime(localSlot)} Uhr</span>
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

      <button
        onClick={() => isValid && onSubmit({ participants, notes })}
        disabled={!isValid || loading}
        className={cn(
          "mt-2 py-5 px-6 text-sm font-semibold tracking-[0.15em] uppercase transition-all flex items-center justify-center gap-3",
          isValid && !loading
            ? "bg-[#B59B54] text-white hover:bg-[#a08847] cursor-pointer shadow-lg shadow-[#B59B54]/20"
            : "bg-[#E8E4DF] text-[#6B7280] cursor-not-allowed"
        )}
      >
        {loading ? (
          "Wird gebucht..."
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
  booking,
  eventType
}: {
  booking: BookingData
  eventType: EventType
}) {
  const localSlot = utcToLocal(booking.slot)

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

      {/* Booking Summary Box */}
      <div className="bg-[#F5F0E6] p-8 mb-8">
        <div className="text-[10px] font-medium tracking-[0.25em] uppercase text-[#B59B54] mb-6">
          Zusammenfassung
        </div>

        <div className="space-y-5">
          {/* Terminart */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
              <Handshake className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                Terminart
              </div>
              <div className="text-sm text-[#083256] font-medium">
                {eventType.title}
              </div>
            </div>
          </div>

          {/* Datum */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                Datum
              </div>
              <div className="text-sm text-[#083256] font-medium">
                {formatFullDate(localSlot)}
              </div>
            </div>
          </div>

          {/* Uhrzeit & Dauer */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                Uhrzeit & Dauer
              </div>
              <div className="text-sm text-[#083256] font-mono font-medium">
                {formatTime(localSlot)} Uhr · {eventType.duration} Minuten
              </div>
            </div>
          </div>

          {/* Ort */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
              <Video className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                Ort
              </div>
              <div className="text-sm text-[#083256]">
                Zoom-Videocall (Link folgt per E-Mail)
              </div>
            </div>
          </div>

          {/* Teilnehmer (falls mehrere) */}
          {booking.participants.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280] mb-1">
                  Teilnehmer
                </div>
                <div className="text-sm text-[#083256]">
                  {booking.participants.map(p => `${p.firstName} ${p.lastName}`).join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button className="px-8 py-4 bg-[#083256] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#0a4170] transition-all">
          Termin verschieben
        </button>
        <button className="px-8 py-4 border border-[#C45B4A] text-sm font-medium text-[#C45B4A] tracking-[0.1em] uppercase hover:bg-[#C45B4A] hover:text-white transition-all">
          Termin absagen
        </button>
      </div>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export default function PHMMeet() {
  const [step, setStep] = useState<"select" | "confirmed">("select")
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [slots, setSlots] = useState<Date[]>([])
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(false)

  const step1Ref = useRef<HTMLElement>(null)
  const step2Ref = useRef<HTMLElement>(null)
  const step3Ref = useRef<HTMLElement>(null)
  const timeSlotsRef = useRef<HTMLDivElement>(null)

  const currentStep = !selectedEvent ? 1 : !selectedSlot ? 2 : 3

  const scrollToSection = useCallback((ref: React.RefObject<HTMLElement | null>, offset = 140) => {
    if (ref.current) {
      const elementPosition = ref.current.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }, [])

  const handleStepClick = useCallback((stepNum: number) => {
    switch (stepNum) {
      case 1:
        scrollToSection(step1Ref)
        break
      case 2:
        if (selectedEvent) scrollToSection(step2Ref)
        break
      case 3:
        if (selectedSlot) scrollToSection(step3Ref)
        break
    }
  }, [selectedEvent, selectedSlot, scrollToSection])

  useEffect(() => {
    if (selectedDate && selectedEvent) {
      const generatedSlots = generateSlotsUTC(selectedDate, selectedEvent.duration)
      setSlots(generatedSlots)
      setSelectedSlot(null)
      // Scroll to time slots after date selection
      setTimeout(() => {
        if (timeSlotsRef.current) {
          const elementPosition = timeSlotsRef.current.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - 140
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          })
        }
      }, 150)
    }
  }, [selectedDate, selectedEvent])

  // Auto-scroll to step 2 when event is selected
  useEffect(() => {
    if (selectedEvent && !selectedSlot) {
      setTimeout(() => scrollToSection(step2Ref), 100)
    }
  }, [selectedEvent, selectedSlot, scrollToSection])

  // Auto-scroll to step 3 when slot is selected
  useEffect(() => {
    if (selectedSlot) {
      setTimeout(() => scrollToSection(step3Ref), 100)
    }
  }, [selectedSlot, scrollToSection])

  const handleBook = useCallback((formData: { participants: Participant[], notes: string }) => {
    if (!selectedSlot) return

    setLoading(true)
    setTimeout(() => {
      setBooking({
        ...formData,
        slot: selectedSlot
      })
      setStep("confirmed")
      setLoading(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 1200)
  }, [selectedSlot])

  return (
    <div className="min-h-screen bg-[#F8F7F4]">
      {/* Premium Navy Header */}
      <header className="bg-[#083256] border-b-4 border-[#B59B54]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Logo variant="light" />
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] tracking-[0.2em] uppercase text-[#B59B54]/70">
                Beratung buchen
              </div>
              <div className="font-serif text-sm text-white">
                Thilo Mund
              </div>
            </div>
            <div className="w-10 h-10 bg-[#B59B54] flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 pb-20">
        {step === "confirmed" && booking && selectedEvent ? (
          <ConfirmationView booking={booking} eventType={selectedEvent} />
        ) : (
          <>
            {/* Headline */}
            <div className="text-center mb-10 animate-fadeIn">
              <div className="text-[10px] font-medium tracking-[0.3em] uppercase text-[#B59B54] mb-4">
                PHM – DIE FINANZMANUFAKTUR
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#083256] mb-4 leading-tight">
                Vereinbare<br />
                <span className="text-[#B59B54]">deinen Termin.</span>
              </h1>
              <p className="text-[#6B7280] max-w-lg mx-auto leading-relaxed">
                Persönliche Beratung mit Thilo Mund. Wähle einen passenden Termin für unser Gespräch.
              </p>
            </div>

            {/* Progress Indicator */}
            <ProgressIndicator currentStep={currentStep} onStepClick={handleStepClick} />

            {/* Step 1: Event Type Selection */}
            <section ref={step1Ref} id="step-1" className="mb-10 scroll-mt-36">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-[#083256] flex items-center justify-center">
                  <span className="text-white font-mono text-sm">01</span>
                </div>
                <h2 className="text-sm font-medium tracking-[0.15em] uppercase text-[#083256]">
                  Terminart wählen
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                {EVENT_TYPES.map((event) => (
                  <EventTypeCard
                    key={event.slug}
                    event={event}
                    isSelected={selectedEvent?.slug === event.slug}
                    onClick={() => {
                      setSelectedEvent(event)
                      setSelectedSlot(null)
                    }}
                  />
                ))}
              </div>
            </section>

            {/* Step 2: Date & Time Selection */}
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

                  {selectedDate && (
                    <div ref={timeSlotsRef} className="mt-8 pt-8 border-t border-[#E8E4DF] animate-fadeIn">
                      <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-4 h-4 text-[#B59B54]" strokeWidth={1.5} />
                        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#6B7280]">
                          Verfügbare Zeiten am {formatDate(selectedDate)}
                        </span>
                      </div>
                      <TimeSlots
                        slots={slots}
                        selectedSlot={selectedSlot}
                        onSelect={setSelectedSlot}
                      />
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Step 3: Contact Information */}
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
                  loading={loading}
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
            <Logo variant="light" />
            <div className="text-center sm:text-right flex flex-col gap-2">
              <div className="text-xs text-white/80">
                PHM – die Finanzmanufaktur | Inh. Thilo Mund | info@phm-bonn.de
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-4 text-[10px] text-[#B59B54]/70">
                <a href="https://diefinanzmanufaktur.de/impressum.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#B59B54] transition-colors">
                  Impressum
                </a>
                <span>|</span>
                <a href="https://diefinanzmanufaktur.de/datenschutz.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#B59B54] transition-colors">
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
