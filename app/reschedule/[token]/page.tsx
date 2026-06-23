'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  token: string
  event_type: string
  title: string
  start_time: string
  end_time: string
  guest_name: string
  guest_email: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  notes?: string
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  navy:      '#083256',
  gold:      '#B59B54',
  offwhite:  '#F8F7F4',
  charcoal:  '#2A2A2A',
  line:      '#E2DED8',
  red:       '#C0392B',
}

const font = {
  display: '"Cormorant Garamond", Georgia, serif',
  body:    '"DM Sans", system-ui, sans-serif',
  mono:    '"DM Mono", "Courier New", monospace',
}

// ─── Date / time helpers ──────────────────────────────────────────────────────

/** Returns the Monday–Friday dates of the week at `offset` weeks from now */
function getWeekDates(offset: number): Date[] {
  const now  = new Date()
  const day  = now.getDay() // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day // distance to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Minimum 28 h in the future → day is bookable if it ends after cutoff */
function isDayBookable(date: Date): boolean {
  const cutoff = Date.now() + 28 * 60 * 60 * 1000
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay.getTime() > cutoff
}

const fmtLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  })

// ─── Shared small components ──────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: C.offwhite, fontFamily: font.body }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        {children}
      </div>
    </main>
  )
}

function PageHeader({ title }: { title: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 40 }}>
      <div style={{ fontSize: 12, letterSpacing: '0.18em', color: C.gold, fontFamily: font.mono, marginBottom: 14, textTransform: 'uppercase' }}>
        PHM – die Finanzmanufaktur
      </div>
      <h1 style={{ fontFamily: font.display, fontSize: 34, fontWeight: 600, color: C.navy, margin: 0, lineHeight: 1.15 }}>
        {title}
      </h1>
    </div>
  )
}

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 8, padding: '20px 24px', marginBottom: 36 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', color: C.gold, fontFamily: font.mono, textTransform: 'uppercase', marginBottom: 8 }}>
        Aktueller Termin
      </div>
      <div style={{ fontWeight: 600, color: C.navy, fontSize: 16, marginBottom: 4 }}>
        {booking.title}
      </div>
      <div style={{ color: C.charcoal, fontSize: 15 }}>
        {fmtLongDate(booking.start_time)} Uhr
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <Shell>
      <div style={{ textAlign: 'center', paddingTop: 120, color: C.navy, fontSize: 15 }}>
        Lade…
      </div>
    </Shell>
  )
}

function InfoPage({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <PageHeader title={title} />
      <p style={{ textAlign: 'center', color: '#666', fontSize: 15, lineHeight: 1.7 }}>{body}</p>
    </Shell>
  )
}

function SuccessPage({ newSlot }: { newSlot: string }) {
  return (
    <Shell>
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: C.navy, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 28px',
        }}>✓</div>
        <h2 style={{ fontFamily: font.display, fontSize: 30, color: C.navy, marginBottom: 16 }}>
          Termin verschoben
        </h2>
        <p style={{ color: C.charcoal, fontSize: 15, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
          Wir haben deinen Termin auf <strong>{fmtTime(newSlot)} Uhr</strong> verschoben.
          Du bekommst gleich eine Bestätigung per E-Mail.
        </p>
      </div>
    </Shell>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReschedulePage() {
  const params  = useParams()
  const token   = params.token as string

  // ── Data state
  const [booking,       setBooking]       = useState<Booking | null>(null)
  const [loadError,     setLoadError]     = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)

  // ── Slot picker state
  const [weekOffset,    setWeekOffset]    = useState(0)
  const [slotsByDate,   setSlotsByDate]   = useState<Record<string, string[]>>({})
  const [weekLoading,   setWeekLoading]   = useState(false)
  const [selectedDate,  setSelectedDate]  = useState<string | null>(null)
  const [selectedSlot,  setSelectedSlot]  = useState<string | null>(null)

  // ── Submit state
  const [submitting,    setSubmitting]    = useState(false)
  const [submitError,   setSubmitError]   = useState<string | null>(null)
  const [success,       setSuccess]       = useState(false)

  // ── Load booking by token
  useEffect(() => {
    if (!token) return
    fetch(`/api/booking?token=${token}`)
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then(b => { setBooking(b); setLoading(false) })
      .catch(() => {
        setLoadError('Wir konnten deine Buchung nicht finden. Bitte prüfe den Link in deiner E-Mail.')
        setLoading(false)
      })
  }, [token])

  // ── Load slots whenever week or event type changes
  const fetchWeekSlots = useCallback(() => {
    if (!booking) return
    const monday    = getWeekDates(weekOffset)[0]
    const dateParam = toDateKey(monday)

    setWeekLoading(true)
    setSlotsByDate({})
    setSelectedDate(null)
    setSelectedSlot(null)

    fetch(`/api/slots?eventType=${booking.event_type}&date=${dateParam}&range=week`)
      .then(r => r.json())
      .then((data: unknown) => {
        // API returns flat array of ISO strings
        const all: string[] = Array.isArray(data)
          ? (data as string[])
          : ((data as any).slots ?? [])

        // Group by YYYY-MM-DD
        const grouped: Record<string, string[]> = {}
        for (const iso of all) {
          const key = iso.slice(0, 10)
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(iso)
        }
        setSlotsByDate(grouped)
        setWeekLoading(false)
      })
      .catch(() => {
        setSlotsByDate({})
        setWeekLoading(false)
      })
  }, [booking, weekOffset])

  useEffect(() => { fetchWeekSlots() }, [fetchWeekSlots])

  // ── Confirm reschedule
  const handleConfirm = async () => {
    if (!selectedSlot || !booking) return
    setSubmitting(true)
    setSubmitError(null)

    const durationMs =
      new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()
    const newStart = new Date(selectedSlot)
    const newEnd   = new Date(newStart.getTime() + durationMs)

    try {
      const res = await fetch('/api/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token:        booking.token,
          newStartTime: newStart.toISOString(),
          newEndTime:   newEnd.toISOString(),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as any).error || `Fehler ${res.status}`)
      }
      setSuccess(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Verschiebung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Early returns ────────────────────────────────────────────────────────

  if (loading) return <Spinner />

  if (loadError || !booking) {
    return <InfoPage
      title="Buchung nicht gefunden"
      body={loadError ?? 'Ungültiger oder abgelaufener Link.'}
    />
  }

  if (booking.status === 'cancelled') {
    return <InfoPage
      title="Termin bereits storniert"
      body="Dieser Termin wurde storniert und kann nicht mehr verschoben werden."
    />
  }

  if (success && selectedSlot) return <SuccessPage newSlot={selectedSlot} />

  // ─── Derived data ─────────────────────────────────────────────────────────
  const weekDates    = getWeekDates(weekOffset)
  const daySlots     = selectedDate ? (slotsByDate[selectedDate] ?? []) : []
  const hasDaySlots  = (d: Date) => !!slotsByDate[toDateKey(d)]?.length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Shell>
      <PageHeader title="Termin verschieben" />
      <BookingCard booking={booking} />

      {/* Section title */}
      <h2 style={{ fontFamily: font.display, fontSize: 22, color: C.navy, marginBottom: 20, marginTop: 0 }}>
        Neuen Termin wählen
      </h2>

      {/* ── Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <NavButton
          onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
          disabled={weekOffset === 0}
        >←</NavButton>

        <span style={{ fontSize: 14, color: C.charcoal, fontWeight: 500 }}>
          {weekDates[0].toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          {' – '}
          {weekDates[4].toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>

        <NavButton onClick={() => setWeekOffset(o => o + 1)} disabled={false}>→</NavButton>
      </div>

      {/* ── Day buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 28 }}>
        {weekDates.map(date => {
          const key         = toDateKey(date)
          const bookable    = isDayBookable(date)
          const hasSlots    = !weekLoading && hasDaySlots(date)
          const active      = bookable && hasSlots
          const isSelected  = selectedDate === key

          return (
            <button
              key={key}
              disabled={!active}
              onClick={() => { setSelectedDate(key); setSelectedSlot(null) }}
              style={{
                padding:       '10px 4px',
                border:        `2px solid ${isSelected ? C.navy : active ? C.line : 'transparent'}`,
                borderRadius:  6,
                background:    isSelected ? C.navy : active ? 'white' : 'transparent',
                color:         isSelected ? 'white' : active ? C.charcoal : '#C0BDB7',
                cursor:        active ? 'pointer' : 'not-allowed',
                fontSize:      12,
                textAlign:     'center',
                transition:    'all 0.15s',
                lineHeight:    1.4,
              }}
            >
              <div>{date.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
                {date.getDate()}
              </div>
              <div style={{ fontSize: 11 }}>
                {date.toLocaleDateString('de-DE', { month: 'short' })}
              </div>
            </button>
          )
        })}
      </div>

      {weekLoading && (
        <div style={{ textAlign: 'center', color: '#999', fontSize: 14, marginBottom: 24 }}>
          Lade verfügbare Zeiten…
        </div>
      )}

      {/* ── Time slots */}
      {selectedDate && !weekLoading && (
        <div style={{ marginBottom: 32 }}>
          {daySlots.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', fontSize: 14, padding: 16 }}>
              Kein freier Termin an diesem Tag – bitte einen anderen Tag wählen.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {daySlots.map(slot => {
                const sel = selectedSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding:      '11px 8px',
                      border:       `2px solid ${sel ? C.gold : C.line}`,
                      borderRadius: 6,
                      background:   sel ? C.gold : 'white',
                      color:        sel ? 'white' : C.charcoal,
                      cursor:       'pointer',
                      fontSize:     14,
                      fontWeight:   sel ? 600 : 400,
                      transition:   'all 0.15s',
                    }}
                  >
                    {fmtTime(slot)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm */}
      {selectedSlot && (
        <div>
          {submitError && (
            <div style={{ background: '#FFF0F0', border: `1px solid #F5C6C6`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, color: C.red, fontSize: 14 }}>
              {submitError}
            </div>
          )}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            style={{
              width:         '100%',
              padding:       '16px',
              background:    submitting ? '#8FA9BF' : C.navy,
              color:         'white',
              border:        'none',
              borderRadius:  8,
              fontSize:      16,
              fontWeight:    600,
              cursor:        submitting ? 'not-allowed' : 'pointer',
              fontFamily:    font.body,
              transition:    'background 0.2s',
            }}
          >
            {submitting
              ? 'Wird verschoben…'
              : `Termin verschieben auf ${fmtTime(selectedSlot)} Uhr`}
          </button>
        </div>
      )}

      <Footer />
    </Shell>
  )
}

// ─── Micro components ─────────────────────────────────────────────────────────

function NavButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background:   'none',
        border:       'none',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        color:        disabled ? C.line : C.navy,
        fontSize:     20,
        padding:      '4px 10px',
        borderRadius: 4,
      }}
    >
      {children}
    </button>
  )
}

function Footer() {
  return (
    <div style={{ textAlign: 'center', marginTop: 56, fontSize: 12, color: '#AAA', fontFamily: font.mono }}>
      PHM – die Finanzmanufaktur · Bonn
    </div>
  )
}
