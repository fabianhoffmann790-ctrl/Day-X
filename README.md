# Day-X

Eigenständiger Zombie-Survival-FPS-Prototyp, inspiriert vom Hardcore-Survival-Genre, ohne geschützte Namen, Assets, Sounds, Karten, UI-Elemente oder Logos anderer Spiele.

## Start in VS Code

```bash
npm install
npm run dev
```

Danach die lokale Vite-Adresse im Browser öffnen, meistens `http://localhost:5173`.

## Scripts

- `npm run dev` startet den Entwicklungsserver.
- `npm run build` erzeugt einen Produktions-Build.
- `npm run preview` startet die lokale Vorschau des Builds.

## Steuerung

- WASD: Bewegen
- Maus: Blickrichtung
- Linksklick: Nahkampf / Schießen
- Shift: Sprinten
- C oder Strg: Schleichen
- Space: Springen
- E: Loot, Türen, Container, Fahrzeuge oder Storage-Kisten interagieren
- Tab: Inventar ein-/ausblenden
- K: Crafting-Menü öffnen/schließen
- 4-9 und 0: sichtbare Crafting-Rezepte ausführen, wenn Crafting geöffnet ist
- M: Karte öffnen/schließen, wenn Karte im Inventar ist
- N: Basebuilding-Bauteil wechseln und Baumodus aktivieren
- P: gewähltes Basebuilding-Element platzieren
- O: erstes nicht-ausgerüstetes Item in offene Storage-Kiste legen
- I: erstes Item aus offener Storage-Kiste ins Inventar nehmen
- Esc: Storage-Kiste schließen
- R: Ausgerüstete Schusswaffe nachladen
- 1/2/3: Waffe wechseln, wenn vorhanden
- V: beste Rüstung/Kleidung ausrüsten
- B: besten Rucksack ausrüsten
- F: beste Nahrung essen
- G: bestes Getränk trinken
- H: Medizin verwenden
- T: beschädigtes ausgerüstetes Item reparieren
- Y: Lagerfeuer platzieren und anzünden
- F6: Spielstand speichern
- F9: Spielstand laden
- F10: Debug-Lootrespawn
- X: Drop-System ist vorbereitet, aber noch nicht aktiv

## Prototyp-Inhalt

- Hauptmenü
- Größere Open-World-Platzhalterkarte mit Siedlung, Straßen, Waldstücken, Feldern, Fahrzeugwracks, Zäunen, Klinik, Polizei, Supermarkt, Werkstatt/Lagerhalle und Militär-Checkpoint
- Betretbare Platzhalter-Gebäude mit dunkleren Innenbereichen, Eingängen und passenden Lootspots
- First-Person-Controller mit Pointer Lock
- HP, Ausdauer, Hunger, Durst, Blutung, Infektion, Krankheit, Schmerz, Nässe, Kälte und Körpertemperatur
- Kleidungssystem mit Slots: Kopf, Oberkörper, Beine, Schuhe, Hände, Weste/Rüstung und Rucksack
- Items haben Zustand, Gewicht und Gameplay-Wirkung
- Reparatursystem mit Nähset, Klebeband, Werkzeugkasten und Waffenreinigungsset
- Crafting-System mit einfachen Rezepten
- Lagerfeuer kann platziert werden, brennt begrenzt, erzeugt Licht und wärmt den Spieler
- Türen-System: Türen können geöffnet, geschlossen, verschlossen, mit Schlüssel geöffnet, mit Dietrich geöffnet oder laut aufgebrochen werden
- Zugangssystem mit einfachem Schlüssel, Dietrich, Polizeischlüssel, Klinikschlüssel und Militär-Zugangskarte
- Container-System: Schränke, Kühlschränke, Spinde, Waffenschränke, Medizinschränke, Werkzeugkisten, Militärkisten, Mülltonnen und Fahrzeug-Kofferäume
- Fahrzeuge als Deckung und lootbare Kofferraum-Container: Auto, Polizeiauto, Krankenwagen, Militärfahrzeug und Lieferwagen
- Basebuilding-Grundsystem: Barrikade, Storage-Kiste, Holzwand, Holztor, Zaunsegment und Schlafsack vorbereitet
- Storage-System: platzierbare Storage-Kiste mit persistierendem Inhalt
- Dynamische Events: Rauchsignal, Helikopter-Crash, Militärkonvoi, seltene Loot-Kiste und Gebäudealarm vorbereitet
- Zombie-Horde als wandernde Gefahr, die auf laute Geräusche reagieren kann
- Dezentes Hinweis-/Missionssystem über Notizzettel, Signalhinweise, POI-Namen und Event-Hinweise
- Einfache Orientierung mit Karte und Kompass-Anzeige
- Persistente Weltzustände: Türen, Container, platzierte Objekte, Storage-Inhalte, Events, Horden, Lagerfeuer und Lootspots werden gespeichert
- Zeitbasierte Aktionen mit Fortschrittsbalken für Essen, Trinken, Medizin, Nachladen, Reparatur, Crafting, Türen aufbrechen, Container durchsuchen und Bauen
- Aktionen brechen ab, wenn der Spieler sich zu weit bewegt oder getroffen wird
- Zonenbasierte Zombiespawns und verbesserte Zombie-KI
- Tag-Nacht-System und Wetter-System
- HUD, Statuswarnungen, Interaktionsanzeige, Event-Hinweise, Karten-/Storage-Overlay, Schadens-Flash und Inventar-Overlay
- Lokales Save-System über `localStorage`
- Zentrale Balancing-Datei: `src/game/Balance.ts`

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können in den World-/Entity-Modulen ergänzt werden.
