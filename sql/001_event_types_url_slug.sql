-- Paket 1: Slug-basierte Terminseiten (PHM Meet)
-- Ausführen im Supabase SQL Editor vor Frontend-Deploy

ALTER TABLE event_types ADD COLUMN IF NOT EXISTS url_slug TEXT UNIQUE;
ALTER TABLE event_types ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false;

UPDATE event_types SET
  url_slug = CASE slug
    WHEN 'erstgespraech'   THEN 'kennenlernen'
    WHEN 'zweitgespraech'  THEN 'analyse'
    WHEN 'drittgespraech'  THEN 'feinschliff'
    WHEN 'umsetzung'       THEN 'onboarding'
    WHEN 'vertiefung'      THEN 'vertiefung'
    WHEN 'telefon'         THEN 'telefon'
    WHEN 'service'         THEN 'service'
    ELSE slug
  END,
  show_on_homepage = CASE slug
    WHEN 'telefon' THEN true
    WHEN 'service' THEN true
    ELSE false
  END;

UPDATE event_types SET active = true
WHERE slug IN ('erstgespraech', 'zweitgespraech', 'drittgespraech', 'umsetzung', 'vertiefung');
