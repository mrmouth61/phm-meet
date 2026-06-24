import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE =
  process.env.N8N_INTERNAL_URL?.replace(/\/$/, '') || 'https://n8n.phm-bonn.de'

const MAX_ATTEMPTS = 3
const TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventType = searchParams.get('eventType')
  const date = searchParams.get('date')
  const range = searchParams.get('range') || 'week'

  if (!eventType || !date) {
    return NextResponse.json({ error: 'eventType und date sind Pflicht' }, { status: 400 })
  }

  const url = `${N8N_BASE}/webhook/meet-slots?eventType=${encodeURIComponent(eventType)}&date=${encodeURIComponent(date)}&range=${encodeURIComponent(range)}`

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      const text = await res.text()

      if (!res.ok) {
        lastError = new Error(`n8n HTTP ${res.status}`)
        if (attempt < MAX_ATTEMPTS) continue
        return NextResponse.json({ error: 'n8n error' }, { status: res.status })
      }

      if (!text.trim()) {
        lastError = new Error('empty n8n response')
        if (attempt < MAX_ATTEMPTS) continue
        return NextResponse.json({
          slots: [],
          timezone: 'Europe/Berlin',
          eventType: { slug: eventType, title: eventType, duration: 0 },
          meta: { emptyResponse: true },
        })
      }

      return NextResponse.json(JSON.parse(text))
    } catch (err) {
      lastError = err
      if (attempt < MAX_ATTEMPTS) continue
    }
  }

  console.error('[api/slots] failed after retries:', lastError)
  return NextResponse.json({ error: 'Verbindungsfehler zu n8n' }, { status: 502 })
}
