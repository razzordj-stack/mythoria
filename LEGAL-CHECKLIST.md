# Mythoria – rechtliche Veröffentlichungssperre

Stand: 31. Juli 2026. Diese Checkliste ist keine Rechtsberatung. Vor einem öffentlichen oder entgeltlichen Livebetrieb muss eine qualifizierte Rechtsprüfung erfolgen.

## Zwingend vor Veröffentlichung

- Sämtliche `LEGAL_*`-Variablen mit echten Betreiberangaben füllen; keine eckigen Platzhalter dürfen öffentlich sichtbar bleiben.
- Rechtsform, Vertretungsberechtigung, Registerdaten, USt-ID und Aufsichtsbehörde passend zum tatsächlichen Betreiber prüfen.
- Zuständige Landesdatenschutzbehörde einsetzen.
- Produktionshoster, Serverstandort, Logdaten und Löschfristen in der Datenschutzerklärung ergänzen.
- Auftragsverarbeitungsverträge und Unterauftragsverarbeiter von Hosting, Supabase, OpenAI/OpenRouter und weiteren Dienstleistern dokumentieren.
- Supabase-Projektregion, Row-Level-Security, Storage-Regeln, Backups und Löschprozess prüfen.
- OpenAI/OpenRouter: Modell, Datenverwendung, Speicheroptionen, Drittlandtransfer und Freigabe sensibler Eingaben prüfen.
- Verzeichnis von Verarbeitungstätigkeiten, Löschkonzept, Berechtigungskonzept, TOMs und Verfahren für Betroffenenanfragen intern dokumentieren.
- Datenschutzvorfall-Prozess einschließlich 72-Stunden-Prüfung vorbereiten.
- Kontoexport, Kontolöschung und Berichtigung praktisch testen.

## Vor echten Zahlungen

- Stripe vom Test- in den Live-Modus überführen und Unternehmensverifizierung abschließen.
- Klären, ob freier Beitrag, Schenkung, Kauf oder Unterstützerpaket vorliegt; keine „steuerlich absetzbare Spende“ versprechen.
- Endpreise, Steuern, Leistungsbeschreibung, Zahlungsbedingungen und Bestellbestätigung ergänzen.
- Widerrufsbelehrung und Musterformular juristisch auf das konkrete Angebot anpassen.
- Bei digitalen Inhalten eine nicht vorangekreuzte ausdrückliche Zustimmung zum sofortigen Beginn und Kenntnis vom möglichen Erlöschen des Widerrufsrechts umsetzen.
- Rückerstattungs-, Rechnungs- und Beschwerdeprozess einrichten.

## Cookies und neue Dienste

- Aktuell sind nur notwendige Auth-Cookies und die lokale Vorlese-Einstellung dokumentiert.
- Vor Analytics, Marketing-Pixeln, eingebetteten Medien oder optionalen SDKs eine Einwilligungsprüfung nach § 25 TDDDG durchführen.
- Falls erforderlich: Consent-Management mit gleichwertigem „Ablehnen“ und „Akzeptieren“, granularer Auswahl, Protokollierung und jederzeitiger Widerrufsmöglichkeit einbauen.

## Betrieb und Community

- Discord-Regeln, Datenschutzhinweise und Moderationsprozess regelmäßig abgleichen.
- Verfahren für rechtswidrige Nutzerinhalte, Meldungen, Sperren und Einsprüche dokumentieren.
- Alterszielgruppe und Jugendschutz fachlich prüfen; bei gezieltem Angebot an Kinder zusätzliche Anforderungen umsetzen.
- Marken-, Bild-, Musik-, Karten- und KI-Inhaltsrechte nachweisbar klären.
