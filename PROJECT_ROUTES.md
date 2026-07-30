# Mythoria Routenübersicht

## Vorhandene und gestaltete Routen

| Route                                                | Status                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `/`                                                  | Startseite gestaltet                                        |
| `/login`                                             | Authentifizierung gestaltet                                 |
| `/register`                                          | Registrierung gestaltet                                     |
| `/forgot-password`                                   | Passwort-Reset-Anforderung gestaltet                        |
| `/reset-password`                                    | Passwortänderung gestaltet                                  |
| `/dashboard`                                         | Vorhandene Funktionen gestaltet                             |
| `/dashboard/characters`                              | Charakterübersicht gestaltet                                |
| `/dashboard/characters/new`                          | Charaktererstellung gestaltet                               |
| `/dashboard/characters/[id]`                         | Charakterdetail gestaltet                                   |
| `/dashboard/characters/[id]/edit`                    | Charakterbearbeitung gestaltet                              |
| `/dashboard/characters/[id]/inventory`               | Inventar gestaltet                                          |
| `/dashboard/characters/[id]/inventory/new`           | Gegenstandsformular gestaltet                               |
| `/dashboard/characters/[id]/inventory/[itemId]/edit` | Gegenstandsbearbeitung gestaltet                            |
| `/dashboard/characters/[id]/quests`                  | Questbuch gestaltet                                         |
| `/dashboard/characters/[id]/skills`                  | Klassenfähigkeiten und sicherer Talentbaum                  |
| `/dashboard/characters/[id]/combat`                  | Kämpfe mit Ausrüstung, Cooldowns, Tränken, Effekten und Beute |
| `/dashboard/characters/[id]/market`                  | Händler, Verkauf, Charisma-Preise und Herstellung           |
| `/dashboard/characters/[id]/reputation`              | Fraktionen, Rufstufen, Ereignisse und Handelsvorteile       |
| `/dashboard/characters/[id]/companions`              | Rekrutierung, Loyalität und aktive Zweiergruppe             |
| `/dashboard/characters/[id]/adventure`               | Gespeicherte Abenteuer, Verlauf und optionaler Vorleser     |
| `/dashboard/characters/[id]/adventure/history`       | Lesbares Archiv aller Chroniken eines Charakters            |
| `/dashboard/profile`                                 | Profil gestaltet                                            |
| `/dashboard/world`                                   | Durchsuchbares, aus Supabase geladenes Weltlexikon          |
| `/dashboard/settings`                                | Persönliche, serverseitig begrenzte Spielleiter-Präferenzen |
| `/dashboard/social`                                  | Freunde, Gilden und vorbereitete Mehrspielergruppen         |
| `/dashboard/notifications`                           | In-App-Meldungen mit Ungelesenstatus und Zielverlinkungen   |
| `/dashboard/admin`                                   | Rollenbasierte Inhalte, Moderation, Kennzahlen und Auditlog  |
| `/account-restricted`                                | Serverseitig erzwungener Status für gesperrte Konten        |
| `/api/health`                                       | Öffentlicher Betriebsstatus für Anwendung und Datenbank     |

## Globale Zustände

- `app/loading.tsx`: globaler Ladezustand.
- `app/not-found.tsx`: 404-Seite.
- `app/error.tsx`: globale Fehlergrenze.

## Nicht vorhandene Funktionen

Globale Navigationseinträge für Quests, Abenteuer, Kampf, Handel, Fraktionen und Begleiter bleiben deaktiviert, da diese Systeme einen ausgewählten Charakter benötigen. Freunde, Gilden und vorbereitete Mehrspielergruppen sind unter „Gemeinschaft“ erreichbar. Der rollenbasierte Adminbereich verwaltet Inhaltsstatus und Kontoeinschränkungen mit Auditprotokoll. Der eigentliche gemeinsame KI-Abenteuerlauf und KI-Persönlichkeiten für Begleiter bleiben bis zur abschließenden KI-Phase zurückgestellt. Es wurden keine erfundenen Datenbankabfragen ergänzt.
