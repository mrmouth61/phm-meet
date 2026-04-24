'use client'

import { useEffect, useState } from 'react'
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
  status: 'confirmed' | 'rescheduled' | 'cancelled'
}

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  navy:     '#083256',
  gold:     '#B59B54',
  offwhite: '#F8F7F4',
  charcoal: '#2A2A2A',
  line:     '#E2DED8',
  red:      '#C0392B',
}

const font = {
  display: '"Cormorant Garamond", Georgia, serif',
  body:    '"DM Sans", system-ui, sans-serif',
  mono:    '"DM Mono", "Courier New", monospace',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin',
  })

// ─── Shared layout ────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', background: C.offwhite, fontFamily: font.body }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 20px 80px' }}>
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

function Footer() {
  return (
    <div style={{ textAlign: 'center', marginTop: 56, fontSize: 12, color: '#AAA', fontFamily: font.mono }}>
      PHM – die Finanzmanufaktur · Bonn
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CancelPage() {
  const params = useParams()
  const token  = params.token as string

  const [booking,    setBooking]    = useState<Booking | null>(null)
  const [loadError,  setLoadError]  = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)

  // Form state
  const [reason,     setReason]     = useState('')
  const [step,       setStep]       = useState<'form' | 'confirm'>('form')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState<string | null>(null)
  const [success,    setSuccess]    = useState(false)

  // ── Load booking
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

  // ── Submit cancellation
  const handleCancel = async () => {
    if (!booking) return
    setSubmitting(true)
    setSubmitErr(null)

    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token:  booking.token,
          reason: reason.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as any).error || `Fehler ${res.status}`)
      }
      setSuccess(true)
    } catch (err: any) {
      setSubmitErr(err.message || 'Stornierung fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Early returns ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', paddingTop: 120, color: C.navy, fontSize: 15 }}>Lade…</div>
      </Shell>
    )
  }

  if (loadError || !booking) {
    return (
      <Shell>
        <PageHeader title="Buchung nicht gefunden" />
        <p style={{ textAlign: 'center', color: '#666', lineHeight: 1.7 }}>
          {loadError ?? 'Ungültiger oder abgelaufener Link.'}
        </p>
      </Shell>
    )
  }

  if (booking.status === 'cancelled') {
    return (
      <Shell>
        <PageHeader title="Bereits storniert" />
        <p style={{ textAlign: 'center', color: '#666', lineHeight: 1.7 }}>
          Dieser Termin wurde bereits storniert.
        </p>
      </Shell>
    )
  }

  if (success) {
    return (
      <Shell>
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            border: `2px solid ${C.navy}`, color: C.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 28px',
          }}>✓</div>
          <h2 style={{ fontFamily: font.display, fontSize: 30, color: C.navy, marginBottom: 16 }}>
            Termin storniert
          </h2>
          <p style={{ color: C.charcoal, fontSize: 15, lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
            Dein Termin wurde storniert. Du bekommst gleich eine Bestätigung per E-Mail.
          </p>
        </div>
        <Footer />
      </Shell>
    )
  }

  // ─── Booking card ─────────────────────────────────────────────────────────

  const BookingCard = (
    <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 8, padding: '20px 24px', marginBottom: 32 }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', color: C.gold, fontFamily: font.mono, textTransform: 'uppercase', marginBottom: 8 }}>
        Dein Termin
      </div>
      <div style={{ fontWeight: 600, color: C.navy, fontSize: 16, marginBottom: 4 }}>
        {booking.title}
      </div>
      <div style={{ color: C.charcoal, fontSize: 15 }}>
        {fmtLongDate(booking.start_time)} Uhr
      </div>
    </div>
  )

  // ─── Step: form ───────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <Shell>
        <PageHeader title="Termin stornieren" />
        {BookingCard}

        {/* Optional reason */}
        <div style={{ marginBottom: 28 }}>
          <label
            htmlFor="cancel-reason"
            style={{ display: 'block', fontSize: 14, fontWeight: 500, color: C.charcoal, marginBottom: 8 }}
          >
            Grund der Stornierung <span style={{ fontWeight: 400, color: '#999' }}>(optional)</span>
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="z. B. anderweitiger Termin, persönliche Gründe …"
            rows={3}
            style={{
              width:       '100%',
              padding:     '12px',
              border:      `1px solid ${C.line}`,
              borderRadius: 6,
              fontSize:    14,
              color:       C.charcoal,
              background:  'white',
              resize:      'vertical',
              fontFamily:  font.body,
              boxSizing:   'border-box',
              outline:     'none',
            }}
          />
        </div>

        <button
          onClick={() => setStep('confirm')}
          style={{
            width:         '100%',
            padding:       '15px',
            background:    C.red,
            color:         'white',
            border:        'none',
            borderRadius:  8,
            fontSize:      16,
            fontWeight:    600,
            cursor:        'pointer',
            fontFamily:    font.body,
          }}
        >
          Termin stornieren
        </button>
        <Footer />
      </Shell>
    )
  }

  // ─── Step: confirm ────────────────────────────────────────────────────────

  return (
    <Shell>
      <PageHeader title="Termin stornieren" />
      {BookingCard}

      {/* Warning */}
      <div style={{
        background:   '#FFFBF2',
        border:       `1px solid ${C.gold}`,
        borderRadius: 8,
        padding:      '16px 20px',
        marginBottom: 28,
      }}>
        <p style={{ margin: 0, color: C.charcoal, fontSize: 15, lineHeight: 1.6 }}>
          <strong>Bist du sicher?</strong> Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        {reason.trim() && (
          <p style={{ margin: '10px 0 0', color: '#666', fontSize: 13 }}>
            <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.gold }}>Dein Grund: </span>
            {reason}
          </p>
        )}
      </div>

      {submitErr && (
        <div style={{
          background:   '#FFF0F0',
          border:       `1px solid #F5C6C6`,
          borderRadius: 6,
          padding:      '12px 16px',
          marginBottom: 20,
          color:        C.red,
          fontSize:     14,
        }}>
          {submitErr}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Back */}
        <button
          onClick={() => { setStep('form'); setSubmitErr(null) }}
          disabled={submitting}
          style={{
            padding:      '14px',
            background:   'white',
            color:        C.navy,
            border:       `2px solid ${C.navy}`,
            borderRadius: 8,
            fontSize:     15,
            fontWeight:   600,
            cursor:       submitting ? 'not-allowed' : 'pointer',
            fontFamily:   font.body,
          }}
        >
          Zurück
        </button>

        {/* Confirm cancel */}
        <button
          onClick={handleCancel}
          disabled={submitting}
          style={{
            padding:      '14px',
            background:   submitting ? '#999' : C.red,
            color:        'white',
            border:       'none',
            borderRadius: 8,
            fontSize:     15,
            fontWeight:   600,
            cursor:       submitting ? 'not-allowed' : 'pointer',
            fontFamily:   font.body,
            transition:   'background 0.2s',
          }}
        >
          {submitting ? 'Wird storniert…' : 'Ja, stornieren'}
        </button>
      </div>
      <Footer />
    </Shell>
  )
}
