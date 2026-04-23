import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE_URL = 'https://n8n.phm-bonn.de'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${N8N_BASE_URL}/webhook/meet-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Buchung fehlgeschlagen' }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Verbindungsfehler zu n8n' }, { status: 502 })
  }
}
