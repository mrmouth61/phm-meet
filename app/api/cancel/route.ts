import { NextRequest, NextResponse } from 'next/server'

const N8N_BASE =
  process.env.N8N_INTERNAL_URL?.replace(/\/$/, '') || 'https://n8n.phm-bonn.de'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.token) {
      return NextResponse.json({ error: 'token ist Pflichtfeld' }, { status: 400 })
    }

    const res = await fetch(`${N8N_BASE}/webhook/meet-cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: body.token,
        // reason ist optional
        ...(body.reason ? { reason: body.reason } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    })

    const text = await res.text().catch(() => '')

    if (!res.ok) {
      console.error('[api/cancel] n8n error:', res.status, text.slice(0, 500))
      let message = 'Stornierung konnte nicht durchgeführt werden'
      try {
        const errBody = text ? JSON.parse(text) : null
        if (errBody && typeof errBody === 'object' && 'error' in errBody) {
          message = String((errBody as { error: unknown }).error)
        }
      } catch {
        /* n8n liefert manchmal Plain-Text */
      }
      return NextResponse.json({ error: message }, { status: res.status })
    }

    if (!text.trim()) {
      return NextResponse.json({ success: true })
    }

    try {
      const data = JSON.parse(text)
      return NextResponse.json(Array.isArray(data) ? data[0] : data)
    } catch {
      console.error('[api/cancel] n8n non-JSON ok response:', text.slice(0, 200))
      return NextResponse.json({ success: true, raw: text.slice(0, 200) })
    }
  } catch (err) {
    console.error('[api/cancel] Error:', err)
    const message = err instanceof Error ? err.message : 'Interner Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
