# Mythoria Designsystem

## Marke

Mythoria ist ein düsteres KI-Fantasy-Rollenspiel. Die visuelle Sprache verbindet Obsidian, Waldgrün, altes Gold und Pergament mit zurückhaltenden Runen- und Lichtmotiven. Lesbarkeit und Bedienbarkeit haben Vorrang vor Dekoration.

## Farben

Alle verbindlichen Werte liegen als CSS-Variablen in `app/globals.css`. Hauptflächen verwenden `--mythoria-black`, `--mythoria-background`, `--mythoria-surface` und `--mythoria-panel`. Aktionen verwenden Grün bis `--mythoria-neon`; besondere Inhalte nutzen `--mythoria-gold-light` und `--mythoria-parchment`.

Statusfarben: Gesundheit `--mythoria-health`, Mana `--mythoria-mana`, Erfahrung `--mythoria-experience`, Erfolg `--mythoria-success`, Warnung `--mythoria-warning`, Information `--mythoria-info`, Gefahr `--mythoria-danger`.

## Typografie

- Überschriften: Cinzel, 700–800.
- Fließtext und Bedienelemente: Inter, 400–700.
- H1: responsiv 32–48 px; H2: 24–32 px; H3: 18–24 px.
- UI-Text wird nicht kleiner als 12 px gesetzt.

Die Fonts werden über `next/font/google` selbst gehostet.

## Abstände, Radien und Schatten

Das Grundraster verwendet 4, 8, 12, 16, 24, 32 und 48 px. Karten besitzen 18 px, Panels 24 px Radius. Schatten bleiben dunkel und weich; grüner Glow wird nur für aktive oder besondere Elemente verwendet.

## Logo

`components/branding/MythoriaLogo.tsx` verwendet ausschließlich `/public/branding/mythoria-logo-new.png` über `next/image`. Das Seitenverhältnis bleibt erhalten. Navigationen verwenden `small`, große Markenbereiche `large` oder `hero`. Das Emblem ist für kompakte mobile Flächen vorgesehen.

## Komponenten

- `MythoriaButton`: primary, secondary, ghost, danger, gold sowie Loading/Disabled.
- `MythoriaCard`: statisch oder interaktiv.
- `MythoriaInput`, `MythoriaTextarea`, `MythoriaSelect`: Labels, Hinweise und Fehler.
- `MythoriaAlert`, `MythoriaBadge`: einheitliche Zustände.
- `MythoriaModal`, `MythoriaConfirmDialog`: Escape, Fokusfalle und Fokusrückgabe.
- `MythoriaSpinner`, `MythoriaSkeleton`, `MythoriaEmptyState`: Lade- und Leerzustände.
- `MythoriaStatBar`: Gesundheit, Mana, Erfahrung und Gold.
- `MythoriaPageHeader`, `MythoriaSectionTitle`: Seitenhierarchie.

## Formulare

Felder verwenden dunkle Flächen, olivfarbene Rahmen, goldene Beschriftungen und grüne Fokusmarkierungen. Fehler werden immer zusätzlich als verständlicher Text ausgegeben.

## Responsive Regeln

- Mobil bis 639 px, Tablet 640–1023 px, Desktop ab 1024 px, großer Desktop ab 1440 px.
- Bedienelemente sind mindestens 44 px hoch.
- Formulare und Karten wechseln mobil in eine Spalte.
- Dashboard-Navigation wird unter 1024 px als ausfahrbares Menü dargestellt.
- Inhaltscontainer sind höchstens ungefähr 1440 px breit.

## Barrierefreiheit

Alle interaktiven Elemente sind per Tastatur erreichbar und besitzen sichtbare `focus-visible`-Zustände. Dialoge verwalten Fokus und Escape. Farben sind nicht der einzige Bedeutungsträger. `prefers-reduced-motion` reduziert Animationen global.

## Beispiele

```tsx
<MythoriaButton variant="primary">Abenteuer beginnen</MythoriaButton>
<MythoriaAlert variant="error">Die Quest konnte nicht geladen werden.</MythoriaAlert>
<MythoriaStatBar label="Lebenspunkte" value={72} maximum={100} variant="health" />
```
