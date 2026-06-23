import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE =
  process.env.N8N_INTERNAL_URL?.replace(/\/$/, '') || 'https://n8n.phm-bonn.de'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${N8N_BASE}/webhook/meet-booking?token=${encodeURIComponent(token)}`,
      {
        headers: { 'Content-Type': 'application/json' },
        // n8n Webhooks können langsam sein — 10s Timeout
        signal: AbortSignal.timeout(10_000),
      }
    )

    if (res.status === 404) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden' },
        { status: 404 }
      )
    }

    const text = await res.text().catch(() => '')

    if (!res.ok) {
      console.error('[api/booking] n8n error:', res.status, text.slice(0, 500))
      return NextResponse.json(
        { error: 'Fehler beim Laden der Buchung' },
        { status: res.status }
      )
    }

    if (!text.trim()) {
      return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
    }

    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      console.error('[api/booking] n8n non-JSON ok response:', text.slice(0, 200))
      return NextResponse.json({ error: 'Buchung nicht gefunden' }, { status: 404 })
    }
    // n8n kann ein Array, ein direktes Booking oder ein Wrapper-Objekt liefern.
    const raw = Array.isArray(data) ? data[0] : data
    const booking = raw?.booking ?? raw

    if (!booking || !booking.token || !booking.start_time) {
      return NextResponse.json(
        { error: 'Buchung nicht gefunden oder unvollständig' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)
  } catch (err) {
    console.error('[api/booking] Error:', err)
    return NextResponse.json(
      { error: 'Interner Fehler beim Laden der Buchung' },
      { status: 500 }
    )
  }
}
