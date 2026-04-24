import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE =
  process.env.N8N_INTERNAL_URL?.replace(/\/$/, '') || 'https://n8n.phm-bonn.de'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.token || !body.newStartTime || !body.newEndTime) {
      return NextResponse.json(
        { error: 'token, newStartTime und newEndTime sind Pflichtfelder' },
        { status: 400 }
      )
    }

    const res = await fetch(`${N8N_BASE}/webhook/meet-reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: body.token,
        newStartTime: body.newStartTime,
        newEndTime: body.newEndTime,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[api/reschedule] n8n error:', res.status, text)
      return NextResponse.json(
        { error: 'Verschiebung konnte nicht durchgeführt werden' },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(Array.isArray(data) ? data[0] : data)
  } catch (err) {
    console.error('[api/reschedule] Error:', err)
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
