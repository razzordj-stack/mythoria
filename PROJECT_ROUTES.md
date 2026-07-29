# Mythoria Routenübersicht

## Vorhandene und gestaltete Routen

| Route | Status |
|---|---|
| `/` | Startseite gestaltet |
| `/login` | Authentifizierung gestaltet |
| `/register` | Registrierung gestaltet |
| `/forgot-password` | Passwort-Reset-Anforderung gestaltet |
| `/reset-password` | Passwortänderung gestaltet |
| `/dashboard` | Vorhandene Funktionen gestaltet |
| `/dashboard/characters` | Charakterübersicht gestaltet |
| `/dashboard/characters/new` | Charaktererstellung gestaltet |
| `/dashboard/characters/[id]` | Charakterdetail gestaltet |
| `/dashboard/characters/[id]/edit` | Charakterbearbeitung gestaltet |
| `/dashboard/characters/[id]/inventory` | Inventar gestaltet |
| `/dashboard/characters/[id]/inventory/new` | Gegenstandsformular gestaltet |
| `/dashboard/characters/[id]/inventory/[itemId]/edit` | Gegenstandsbearbeitung gestaltet |
| `/dashboard/characters/[id]/quests` | Questbuch gestaltet |
| `/dashboard/characters/[id]/adventure` | Geschützter Platzhalter gestaltet |
| `/dashboard/profile` | Profil gestaltet |
| `/dashboard/world` | Datenfreier Platzhalter |
| `/dashboard/settings` | Datenfreier Platzhalter |

## Globale Zustände

- `app/loading.tsx`: globaler Ladezustand.
- `app/not-found.tsx`: 404-Seite.
- `app/error.tsx`: globale Fehlergrenze.

## Nicht vorhandene Funktionen

Keine Routen existieren derzeit für Kampf, Freunde, Gilden oder Adminbereich. Globale Navigationseinträge für Quests und Abenteuer bleiben deaktiviert, da beide Systeme einen ausgewählten Charakter benötigen. Freunde und Gilden sind als „Bald“ markiert. Es wurden keine erfundenen Datenbankabfragen ergänzt.
