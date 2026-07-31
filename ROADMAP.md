# Mythoria – aktuelle Roadmap

**Stand:** 31. Juli 2026
**Projektphase:** Funktionsumfang weitgehend umgesetzt, Release-Vorbereitung begonnen  
**Grundsatz:** Die KI-Spielleiter-Integration ist mit `gpt-5.6-terra` technisch eingerichtet und wird nach gesicherter API-Abrechnung und Live-Tests final abgenommen.

## Gesamtstatus

Mythoria besitzt inzwischen eine vollständige Next.js-Grundstruktur, ein einheitliches Fantasy-Design und eine umfangreiche, durch Supabase abgesicherte Spielbasis. Die Anwendung baut fehlerfrei und verfügt über automatisierte Unit-, Browser- und Datenbankprüfungen.

Aktueller Qualitätsstand:

- 18 Unit-Tests bestanden
- 16 Browser-E2E-Tests bestanden
- ESLint und TypeScript bestanden
- Produktions-Build bestanden
- 31 Supabase-Migrationen lokal und remote synchron
- Supabase-Schema-Linter ohne Fehler
- 27 statisch erfasste Seiten sowie zwei API-Routen im aktuellen Produktions-Build vorhanden

## Abgeschlossene Phasen

### 1. Projekt- und Designgrundlage

- Next.js 16, React 19, TypeScript und Tailwind CSS eingerichtet
- globale Styles, Typografie und Fantasy-Farbsystem umgesetzt
- neues Mythoria-Logo integriert
- wiederverwendbare UI-Komponenten erstellt
- responsive App-Navigation, Lade-, Fehler- und Leerzustände ergänzt

### 2. Authentifizierung und Profile

- Registrierung, Login, Logout und Passwort-Reset
- geschützte Dashboard-Routen
- Profilverwaltung
- Profilbild- und Avatar-Upload über Supabase Storage
- gesperrte und gebannte Konten werden serverseitig abgefangen

### 3. Charakter- und Spielsysteme

- Charaktererstellung, Übersicht, Detailansicht und Bearbeitung
- zwölf einheitliche, generierte Fantasy-Porträts für sechs Völker und sechs Klassen
- Klassen- und Volksbilder ohne Emoji-Platzhalter in Erstellung, Vorschau, Dashboard und Charakteransichten integriert
- Attribute, Level, Erfahrung und abgeleitete Werte
- Inventar, Ausrüstung und Gegenstandsverwaltung
- Fähigkeiten und Talentbäume
- Questbuch und Questfortschritt
- taktisches Kampfsystem mit Gegnern, Beute, Tränken und Cooldowns
- Händler, Verkauf und Herstellung
- Fraktionen und Rufsystem
- Begleiter und aktive Gruppe

### 4. Welt und Abenteuer

- Weltlexikon, Orte, Reisen und Entdeckungen
- Erfolge und Belohnungen
- persistente Abenteuer-Sitzungen
- Abenteuerchronik und Archiv
- abgesicherte KI-Antwortstruktur, Anfragebegrenzung und atomare Speicherung vorbereitet

### 5. Gemeinschaft und Administration

- öffentliche Profile und Freundescodes
- Freundschaftsanfragen
- Gilden
- vorbereitete Mehrspielergruppen und Einladungen
- Benachrichtigungssystem
- rollenbasierter Adminbereich
- Inhaltsverwaltung, Benutzermoderation und Audit-Protokoll

### 6.5 Marke und Unterstützung

- öffentliche Support-Seite mit Roadmap-Fortschritt
- Discord-Supportserver auf Start- und Supportseite verlinkt
- rechtliche Grundseiten für Datenschutz, Impressum, Nutzungsbedingungen, Cookies und Widerruf angelegt
- geschützter Markenshop-Platzhalter unter `/dashboard/shop` erstellt
- geplante Produktbereiche für T-Shirts, Hoodies und Accessoires ausgewiesen
- bewusst noch keine Preise, Produktdaten oder Bestellfunktion hinterlegt

### 6. Sicherheit und Qualität

- Supabase Row Level Security und abgesicherte Datenbankfunktionen
- CSP-, Frame-, MIME-, Referrer-, Berechtigungs- und HSTS-Header
- API-Antworten ohne Cache
- frühzeitige API-Authentifizierung und Eingabegrenzen
- Unit- und E2E-Testsystem
- automatisierte GitHub-Qualitätspipeline
- Release- und Umgebungsprüfung
- öffentlicher Health-Endpunkt ohne sensible Ausgaben

## Aktuelle Blocker vor dem Go-live

### Supabase Public API

Die direkte Supabase-CLI-Datenbankverbindung funktioniert und alle Migrationen sind synchron. Das öffentliche Supabase-Gateway beantwortet Anfragen mit den aktuell ausgelesenen Publishable- und Legacy-Anon-Keys jedoch mit HTTP 401. Dadurch meldet `/api/health` derzeit korrekt den Zustand `degraded`.

Vor dem Deployment:

1. Public API und Auth-Einstellungen im Supabase-Dashboard prüfen.
2. Falls erforderlich einen neuen Publishable-Key erzeugen.
3. Key lokal und später im Hosting-Projekt eintragen.
4. `/api/health` erneut prüfen; erwartet werden HTTP 200 und `status: "ok"`.

### Hosting und Domain

Ein Hosting-Ziel und die endgültige Produktionsdomain wurden noch nicht festgelegt. Nach Festlegung müssen in Supabase die Site URL und erlaubten Auth-Redirect-URLs eingetragen werden.

### Abhängigkeitshinweise

`npm audit` meldet transitive Hinweise in den von Next.js eingebundenen Paketen PostCSS und Sharp. Der angebotene automatische Force-Fix würde einen inkompatiblen Downgrade auf Next.js 9 ausführen und darf nicht verwendet werden. Stattdessen auf ein kompatibles Next.js-Update warten und danach erneut prüfen.

## Nächste Phasen

### Phase 7 – Supabase-Zugriff und Release-Freigabe

**Priorität: sehr hoch**

- öffentlichen Supabase-Zugriff reparieren
- Login, Registrierung und Passwort-Reset erneut live testen
- Health-Endpunkt auf `ok` bringen
- vollständigen Release-Check ausführen

**Abnahmekriterium:** Public API erreichbar, Authentifizierung funktioniert, `/api/health` liefert HTTP 200.

### Phase 8 – Hosting und Produktionsbereitstellung

**Priorität: sehr hoch**

- Hosting-Ziel festlegen, bevorzugt ein vollständig unterstützter Next.js-Node-Host
- Produktionsvariablen sicher hinterlegen
- Domain und HTTPS konfigurieren
- Supabase Site URL und Redirect-URLs setzen
- erste Produktionsbereitstellung durchführen
- Logs, Health-Monitoring und Rollback-Ablauf prüfen

**Abnahmekriterium:** Anwendung ist über HTTPS erreichbar und der produktive Smoke-Test besteht.

### Phase 9 – Authentifizierte End-to-End-Tests

**Priorität: hoch**

- separates Testkonto und Testcharakter definieren
- Login-Status für Playwright sicher vorbereiten
- Charaktererstellung und -bearbeitung testen
- Inventar-, Quest-, Kampf- und Reiseabläufe testen
- Rollen- und Moderationszugriffe testen

**Abnahmekriterium:** Kritische Benutzerwege werden automatisch gegen eine sichere Testumgebung geprüft.

### Phase 10 – Mehrspieler-Ausbau

**Priorität: mittel**

- gemeinsame Gruppen-Sitzungen tatsächlich spielbar machen
- Gruppenleiter- und Bereitschaftsabläufe vervollständigen
- Echtzeitstatus mit Supabase Realtime prüfen
- Gildenrollen und Gruppenkommunikation erweitern

**Abnahmekriterium:** Zwei angemeldete Benutzer können zuverlässig eine gemeinsame Gruppe bilden und synchron verwalten.

### Phase 11 – Inhalt und Balancing

**Priorität: mittel**

- weitere Orte, Gegner, Quests, Gegenstände und Rezepte ergänzen
- Levelkurve, Preise, Belohnungen und Kampfstärke ausbalancieren
- Admin-Arbeitsabläufe für neue Inhalte verbessern
- Spieltests und Datenanalyse vorbereiten

**Abnahmekriterium:** Ein zusammenhängender, mehrfach spielbarer Inhaltsbogen steht zur Verfügung.

### Phase 11.5 – Mythoria-Markenshop

**Priorität: später**

- Shopanbieter und Fulfillment-Modell auswählen
- finale Produktmotive und Produktbilder erstellen
- Größen, Materialien, Preise, Versandgebiete und Lieferzeiten festlegen
- Checkout und Zahlungsanbieter rechtssicher integrieren
- Bestellbestätigung, Retouren und Supportablauf ergänzen
- Datenschutz, Widerruf und Impressum vor Veröffentlichung juristisch prüfen lassen

**Abnahmekriterium:** Testbestellung, Zahlung, Bestätigung und Widerrufsablauf funktionieren vollständig; alle Pflichtinformationen sind veröffentlicht.

### Phase 12 – KI-Spielleiter abschließen

**Priorität: zuletzt**

- `gpt-5.6-terra` als ausgewähltes Standardmodell unter realen Spielsitzungen evaluieren
- Provider- und Kostenlimits konfigurieren
- Timeouts, Wiederholungen und Fallback-Modell festlegen
- strukturierte Antworten und Persistenz unter Last testen
- Prompt-Injection-, Inhalts- und Missbrauchsschutz prüfen
- optional KI-Persönlichkeiten für Begleiter ergänzen

**Abnahmekriterium:** Mehrere aufeinanderfolgende Abenteuerzüge werden zuverlässig, sicher und ohne Datenverlust beantwortet und gespeichert.

## Stand zum Tagesabschluss

- Charakterporträt-System und Markenshop-Platzhalter sind umgesetzt.
- `npm run lint` ist ohne Fehler durchgelaufen.
- `npm run build` ist mit Next.js 16.2.12 erfolgreich durchgelaufen; `/dashboard/shop` ist im Build enthalten.
- Die KI-Spielleiter-Integration bleibt entsprechend der aktuellen Entscheidung bis zum Schluss zurückgestellt.

## Empfohlener Wiedereinstieg

Beim nächsten Arbeitstag mit **Phase 7 – Supabase-Zugriff und Release-Freigabe** beginnen. Anschließend die noch offenen Seiten- und Nutzerabläufe visuell prüfen. Der Markenshop bleibt bis zur Auswahl eines Anbieters und zur Festlegung echter Produkte ein klar gekennzeichneter Platzhalter.
