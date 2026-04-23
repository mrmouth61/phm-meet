import { NextResponse } from 'next/server'

const N8N_BASE_URL = 'https://n8n.phm-bonn.de'

export async function GET() {
  try {
    const res = await fetch(`${N8N_BASE_URL}/webhook/meet-event-types`, {
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'n8n error' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Verbindungsfehler zu n8n' }, { status: 502 })
  }
}
