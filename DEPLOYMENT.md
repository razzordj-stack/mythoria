# Mythoria bereitstellen

Mythoria benötigt einen Next.js-kompatiblen Node.js-Host. Ein statischer Export reicht wegen Proxy, Authentifizierung und API-Routen nicht aus. Vercel ist der direkt unterstützte Standardweg; ein anderer Node.js-Host kann `npm run build` und `npm start` verwenden.

## Produktionsvariablen

Im Hosting-Projekt müssen mindestens diese Werte gesetzt sein:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Bei einem bestehenden Projekt wird alternativ auch der ältere Name `NEXT_PUBLIC_SUPABASE_ANON_KEY` unterstützt.

Optional und bis zur letzten KI-Phase nicht erforderlich:

- `OPENAI_API_KEY` und `OPENAI_MODEL` (bevorzugt)
- alternativ `OPENROUTER_API_KEY` und `OPENROUTER_MODEL`

Geheimnisse dürfen niemals als `NEXT_PUBLIC_*` gespeichert oder in das Repository eingecheckt werden. Die beiden Supabase-Werte sind absichtlich öffentlich nutzbare Projektwerte; der Service-Role-Key wird von der Anwendung nicht benötigt.

## Produktionskonfiguration

Die aktuelle Produktionsdomain lautet `https://mythoria-chroniken.com` und wird über Vercel bereitgestellt.

Der Produktions-Health-Endpunkt ist erreichbar:

- `https://mythoria-chroniken.com/api/health` → erwartet HTTP 200 und `status: "ok"`

## Supabase Auth

Sobald die endgültige Domain feststeht, müssen im Supabase-Dashboard unter **Authentication → URL Configuration** gesetzt werden:

- Site URL: `https://mythoria-chroniken.com`
- Redirect URL: `https://mythoria-chroniken.com/dashboard`
- für Vorschauen optional die gezielt benötigten Preview-URLs

Ohne die endgültige Domain kann dieser Schritt nicht vorab sicher automatisiert werden. Wildcard-Redirects sollten für Produktion vermieden werden.

## Release-Ablauf

1. `npm ci`
2. `npm run check:env`
3. `npm run check:release`
4. Supabase-Migrationen mit `npx supabase db push --linked --dry-run` kontrollieren
5. Deployment auslösen
6. `https://DEINE-DOMAIN/api/health` prüfen
7. Registrierung, Login, Logout und Passwort-Reset in Produktion testen

Der Health-Endpunkt antwortet mit HTTP 200, wenn Anwendung und Datenbank erreichbar sind, und mit HTTP 503 bei einer fehlerhaften Konfiguration oder Datenbankverbindung. Er gibt keine Geheimnisse oder internen Daten aus. Browser-Tests prüfen den Vertrag des Endpunkts, behandeln eine externe Supabase-Störung aber nicht als Fehler des Anwendungs-Builds.

## Betrieb

- Plattform-Logs auf HTTP-5xx-Antworten und `Health check` überwachen.
- Den Health-Endpunkt mindestens alle fünf Minuten prüfen. Geeignete Dienste dafür sind beispielsweise Better Uptime, UptimeRobot oder Vercel Monitoring.
- Supabase-Datenbank-Backups vor größeren Migrationen kontrollieren.
- Abhängigkeiten regelmäßig aktualisieren; keine automatischen erzwungenen Major-Downgrades durch `npm audit fix --force` durchführen.
- Bei einem Rollback Anwendung und Datenbankmigrationen getrennt bewerten, da Datenbankmigrationen nicht automatisch durch ein Hosting-Rollback zurückgesetzt werden.

## Geprüfter Produktionsstand – 31. Juli 2026

- Startseite und Login: HTTP 200
- Health-Endpunkt: HTTP 200, Anwendung und Datenbank `ok`
- Nicht angemeldetes Dashboard: HTTP 307 zur Anmeldung
- HSTS, Content-Security-Policy, `X-Frame-Options: DENY` und Referrer-Policy aktiv

## Rollback-Ablauf in Vercel

1. In Vercel das Projekt öffnen und zu **Deployments** wechseln.
2. Das letzte funktionierende Deployment öffnen und **Promote to Production** auswählen.
3. Anschließend `/api/health`, Login und Dashboard erneut prüfen.
4. Datenbankmigrationen nicht zurückrollen, ohne ihre Abhängigkeiten vorher zu prüfen. Bei fehlerhaften Datenbankänderungen eine neue, korrigierende Migration erstellen.

## Manueller Auth-Smoketest

Vor einem größeren Release mit einem separaten Testkonto dokumentieren:

1. Registrierung und Bestätigungs-E-Mail
2. Login und Logout
3. Passwort-Reset und Rückkehr zur Produktionsdomain
4. Erstellung eines Testcharakters
5. Zugriffsschutz: `/dashboard` ohne Sitzung muss zur Anmeldung umleiten
