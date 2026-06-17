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
- R: Ausgerüstete Schusswaffe nachladen
- 1/2/3: Waffe wechseln, wenn vorhanden
- V: beste Rüstung/Kleidung ausrüsten
- B: besten Rucksack ausrüsten
- F: beste Nahrung verwenden
- G: bestes Getränk verwenden
- H: Medizin verwenden
- F6: Spielstand speichern
- F9: Spielstand laden
- F10: Debug-Lootrespawn
- X: Drop-System ist vorbereitet, aber noch nicht aktiv

## Prototyp-Inhalt

- Hauptmenü
- Größere Open-World-Platzhalterkarte mit Siedlung, Straßen, Waldstücken, Feldern, Fahrzeugwracks, Zäunen, Klinik, Polizei, Supermarkt, Werkstatt/Lagerhalle und Militär-Checkpoint
- Betretbare Platzhalter-Gebäude mit dunkleren Innenbereichen, Eingängen und passenden Lootspots
- First-Person-Controller mit Pointer Lock
- HP, Ausdauer, Hunger, Durst, Blutung und vorbereitetem Infektionsstatus
- Inventar mit begrenzten Slots, ausrüstbaren Waffen, Rüstung/Kleidung und Rucksäcken
- Rucksäcke erhöhen die Kapazität, Rüstung reduziert Schaden
- Lootspots mit Spawn-Chance, maximal einem Item, geplündertem Zustand und vorbereitetem Respawn-Zeitpunkt
- Itempools wie `residential_common`, `police_ammo`, `military_weapons`, `hospital_medical` und `industrial_tools`
- Zonenbasierte Zombiespawns: Wohngebiet, Markt, Polizei, Klinik, Industrie, Militär, Wald und Straßen
- Zombies mit Idle, Wandern, Sicht, Geräuschreaktion, Verfolgung, Suche und Nahkampfangriff
- Waffen-Grundsystem mit Nahkampf, Pistole, Gewehr, Munition, Magazinen, Nachladen, Feuerrate und Geräuschradius
- Einfaches Tag-Nacht-System mit veränderter Lichtfarbe, Helligkeit und Sichtweite
- Einfaches Wetter-System mit klar, bewölkt, Regen und Nebel inklusive Fog-/Regen-Platzhaltereffekten
- Eigenständige Platzhalter-Soundstruktur für Schritte, Sprinten, Zombies, Schüsse, Nachladen, Loot, Konsum und Verletzung
- HUD, Warnmeldungen, Interaktionsanzeige, Schadens-Flash und Inventar-Overlay
- Lokales Save-System über `localStorage` für Spielerposition, Werte, Inventar, ausgerüstete Items, Magazine, geplünderte Lootspots, Tageszeit und Wetter
- Zentrale Balancing-Datei: `src/game/Balance.ts`

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können in den World-/Entity-Modulen ergänzt werden.
