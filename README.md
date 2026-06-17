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
- E: Item im Lootspot aufnehmen, wenn du direkt darauf schaust
- Tab: Inventar ein-/ausblenden
- K: Crafting-Menü öffnen/schließen
- 4-9 und 0: sichtbare Crafting-Rezepte ausführen, wenn Crafting geöffnet ist
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
- Bewusstlosigkeit und Knochenbruch sind als Statuswerte vorbereitet
- Kleidungssystem mit Slots: Kopf, Oberkörper, Beine, Schuhe, Hände, Weste/Rüstung und Rucksack
- Kleidung beeinflusst Schadenreduktion, Wärme, Regenschutz, Kapazität und Gewicht
- Items haben Zustand: neu, gut, abgenutzt, beschädigt, stark beschädigt, ruiniert
- Beschädigte Kleidung, Rucksäcke und Waffen wirken schlechter; ruinierte Items können nicht benutzt/ausgerüstet werden
- Reparatursystem mit Nähset, Klebeband, Werkzeugkasten und Waffenreinigungsset
- Crafting-System mit Lumpen, improvisiertem Verband, Fackel, Lagerfeuer-Set, improvisiertem Rucksack, Holzspeer und abgekochtem Wasser als vorbereiteter Mechanik
- Lagerfeuer kann platziert werden, brennt begrenzt, erzeugt Licht und wärmt den Spieler
- Nahrung und Wasser können krank machen, wenn sie verdorben oder schmutzig sind
- Medizin behandelt Blutung, Schmerz, Infektion und Krankheit
- Waffen haben Magazine, Munitionstypen, Zustand und einfache Ladehemmungswahrscheinlichkeit
- Nahkampf verbraucht Ausdauer und beschädigt die Waffe
- Gewicht beeinflusst Ausdauerverbrauch, Regeneration und Sprintfähigkeit
- Zeitbasierte Aktionen mit Fortschrittsbalken für Essen, Trinken, Medizin, Nachladen, Reparatur, Crafting und Feuer
- Aktionen brechen ab, wenn der Spieler sich zu weit bewegt oder getroffen wird
- Lootspots mit Spawn-Chance, maximal einem Item, geplündertem Zustand und vorbereitetem Respawn-Zeitpunkt
- Zonenbasierte Zombiespawns: Wohngebiet, Markt, Polizei, Klinik, Industrie, Militär, Wald und Straßen
- Zombies mit Idle, Wandern, Sicht, Geräuschreaktion, Verfolgung, Suche und Nahkampfangriff
- Einfaches Tag-Nacht-System mit veränderter Lichtfarbe, Helligkeit und Sichtweite
- Einfaches Wetter-System mit klar, bewölkt, Regen und Nebel inklusive Fog-/Regen-Platzhaltereffekten
- Eigenständige Platzhalter-Soundstruktur für Schritte, Sprinten, Zombies, Schüsse, Nachladen, Loot, Konsum und Verletzung
- HUD, Statuswarnungen, Interaktionsanzeige, Schadens-Flash, Inventar-Overlay und Crafting-Overlay
- Lokales Save-System über `localStorage` für Spielerposition, Werte, Inventar, Item-Zustände, Kleidungsslots, Magazine, geplünderte Lootspots, Tageszeit, Wetter und Lagerfeuer
- Zentrale Balancing-Datei: `src/game/Balance.ts`

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können in den World-/Entity-Modulen ergänzt werden.
