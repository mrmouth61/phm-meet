# n8n-Änderungen: Slug-basierte Terminseiten

> Workflow-IDs: `SFPXS0DbJiXmd64n` (Meet API) · `vA97iNkI9AGEtAX3` (PHM-Flow)
> n8n MCP war in dieser Session nicht authentifiziert — manuell in n8n umsetzen.

## 1. Meet API — `/webhook/meet-event-types` (SFPXS0DbJiXmd64n)

**Node „Supabase Event Types“:**

- Query-Parameter `all=true` aus Webhook-Query lesen
- Wenn `all !== 'true'`: Filter `active = true` (wie bisher)
- Wenn `all === 'true'`: kein active-Filter — alle Typen zurückgeben
- Response-Felder ergänzen: `url_slug`, `show_on_homepage`, `active`

## 2. Meet API — Booking-Payload (SFPXS0DbJiXmd64n)

**Code-Node nach Supabase-Insert (BOOKING_CREATED, BOOKING_RESCHEDULED, BOOKING_CANCELLED):**

```javascript
// booking-Objekt im PHM-Flow-Payload:
urlSlug: eventType.url_slug || eventType.slug
```

Event Type wird bereits aus Supabase geladen — `url_slug` mit selektieren.

## 3. PHM-Flow — Stornierungsbestätigung (vA97iNkI9AGEtAX3)

**Node „Daten aufbereiten“ (BOOKING_CANCELLED-Branch):**

```javascript
const urlSlug = items[0].json.booking.urlSlug || items[0].json.booking.eventType;
const rebooking_url = `https://meet.phm-bonn.de/${urlSlug}`;
```

Email-Template: „Neuen Termin buchen“-Link von `https://meet.phm-bonn.de` auf `{{ rebooking_url }}` ändern.

## 4. PHM-Flow — Umbuchungsbestätigung (vA97iNkI9AGEtAX3)

Falls „Alternativ neuen Termin buchen“-Link vorhanden → gleiche `rebooking_url`-Logik wie bei Stornierung.

## Test nach n8n-Deploy

1. `curl 'https://n8n.phm-bonn.de/webhook/meet-event-types?all=true'` → alle Typen inkl. inactive, mit `url_slug`
2. Buchung über `/vertiefung` → Stornierung → Mail-Link zeigt `/vertiefung`
