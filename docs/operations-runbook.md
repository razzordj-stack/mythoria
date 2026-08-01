# Mythoria – Betriebs- und Rollback-Handbuch

## KI-Spielleiter beobachten

1. Öffne **Administration → KI-Monitoring**.
2. Prüfe Fehlerquote, Antwortzeit und Tokenverbrauch der letzten sieben Tage.
3. Bei wiederholten Fehlern: Vercel-Projekt `mythoria` öffnen und die Runtime-Logs der Route `/api/adventure/respond` prüfen.
4. Prüfe in OpenAI die Nutzungs- und Abrechnungslimits. API-Schlüssel niemals in Tickets, Chats oder Logs kopieren.

## Sofortmaßnahme bei Störung

1. Prüfe, ob `OPENAI_API_KEY` und `OPENAI_MODEL` in Vercel Production gesetzt sind.
2. Setze bei einem Provider-Ausfall optional `OPENAI_FALLBACK_MODEL` und starte ein neues Production-Deployment.
3. Falls Antworten weiterhin fehlschlagen, entferne den problematischen Fallback wieder und informiere Spieler über die Statusmeldung auf der Abenteuerseite.

## Rollback eines Deployments

1. Öffne im Vercel-Projekt **mythoria** die Liste der Deployments.
2. Wähle das letzte bestätigte Production-Deployment und nutze **Promote to Production**.
3. Rufe `/api/health` und eine bestehende Abenteuerseite auf.
4. Prüfe mindestens einen Lesezugriff auf Dashboard und Charakterseite; keine neue Spielhandlung absenden, wenn ein Testkonto nicht vorgesehen ist.
5. Notiere Ursache, Zeitpunkt und die gewählte Maßnahme im Admin-Audit oder im internen Betriebsprotokoll.

## Datenbank-Rollback

Supabase-Migrationen werden nicht automatisch rückgängig gemacht. Für eine Datenbankkorrektur immer eine neue, geprüfte Vorwärtsmigration erstellen. Niemals Tabellen oder Spielstände direkt in Production löschen.
