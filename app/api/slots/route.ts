import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE_URL = 'https://n8n.phm-bonn.de'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const eventType = searchParams.get('eventType')
  const date = searchParams.get('date')
  const range = searchParams.get('range') || 'week'

  if (!eventType || !date) {
    return NextResponse.json({ error: 'eventType und date sind Pflicht' }, { status: 400 })
  }

  try {
    const url = `${N8N_BASE_URL}/webhook/meet-slots?eventType=${eventType}&date=${date}&range=${range}`
    const res = await fetch(url, { cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: 'n8n error' }, { status: res.status })
    }
    if (!text.trim()) {
      return NextResponse.json({
        slots: [],
        timezone: 'Europe/Berlin',
        eventType: { slug: eventType, title: eventType, duration: 0 },
        meta: { emptyResponse: true },
      })
    }
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Verbindungsfehler zu n8n' }, { status: 502 })
  }
}
