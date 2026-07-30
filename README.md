# Mythoria

Mythoria ist eine deutschsprachige Fantasy-Rollenspiel-Webanwendung mit persistenten Charakteren, Inventar, Quests, Weltreisen, Fähigkeiten, Talentbäumen, taktischen Kämpfen, Händlern, Herstellung, Fraktionen, Ruf, Begleitern, Freundschaften, Gilden, Mehrspielergruppen, Benachrichtigungen, rollenbasierter Administration und gespeicherten Abenteuerchroniken.

## Technische Grundlage

- Next.js 16 mit App Router und TypeScript
- React 19 und Tailwind CSS 4
- Supabase für Authentifizierung, PostgreSQL, Row Level Security und Avatar-Storage
- Vitest für Unit-Tests
- Playwright für Browser-End-to-End-Tests

## Lokale Entwicklung

1. `.env.example` nach `.env.local` übertragen und die Supabase-Werte ergänzen.
2. Abhängigkeiten mit `npm install` installieren.
3. Entwicklung mit `npm run dev` starten.
4. Anwendung unter `http://localhost:3000` öffnen.

## Qualitätsprüfungen

```bash
npm test
npm run test:e2e
npm run lint
npm run build
```

## Datenbank

Migrationen liegen unter `supabase/migrations`. Das Projekt ist mit Supabase-Projekt `ddqbkitrkcfkneqrzwez` verbunden. Änderungen werden zuerst als Migration erstellt und mit einem Dry-Run geprüft.

## Dokumentation

- `DESIGN_SYSTEM.md`: Designregeln und UI-Komponenten
- `PROJECT_ROUTES.md`: vorhandene Routen und Funktionsstatus
- `.env.example`: benötigte Umgebungsvariablen ohne Geheimnisse
- `DEPLOYMENT.md`: Produktionsvariablen, Supabase-Redirects, Release und Betrieb
- `ROADMAP.md`: aktueller Fortschritt, offene Blocker und nächste Entwicklungsphasen

Die KI-Spielleiter-Anbindung verwendet bevorzugt die OpenAI Responses API mit `gpt-5.6-terra`. OpenRouter bleibt als optionaler Fallback vorbereitet.
Neue Chronikszenen können auf der Abenteuerseite mit einer deutschen Browserstimme vorgelesen oder automatisch nach ihrer Erstellung gestartet werden.

## Sicherheit

- Dashboard-Routen prüfen die Supabase-Sitzung serverseitig und leiten Gäste zur Anmeldung um.
- Datenzugriffe und Verwaltungsfunktionen werden zusätzlich durch Supabase Row Level Security geschützt.
- Globale CSP-, Frame-, MIME-, Referrer-, Berechtigungs- und HSTS-Header härten Browserantworten ab.
- API-Antworten werden nicht zwischengespeichert; die Abenteuer-API authentifiziert Anfragen, bevor sie Provider-Konfiguration oder Nutzdaten verarbeitet.

## Release-Prüfung

`npm run check:env` validiert die erforderlichen Produktionsvariablen. Mit `npm run check:release` laufen Unit-Tests, Lint, Produktions-Build und Browser-Tests in einem Schritt. Der öffentliche Endpunkt `/api/health` prüft Anwendung und Datenbank, ohne Geheimnisse offenzulegen.
