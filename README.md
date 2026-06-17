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
- F: beste Nahrung verwenden
- G: bestes Getränk verwenden
- H: Medizin verwenden
- F6: Spielstand speichern
- F9: Spielstand laden
- X: Drop-System ist vorbereitet, aber noch nicht aktiv

## Prototyp-Inhalt

- Hauptmenü
- Three.js-Spielwelt mit Platzhalter-Gebäuden
- First-Person-Controller mit Pointer Lock
- HP, Ausdauer, Hunger, Durst, Blutung und vorbereitetem Infektionsstatus
- Inventar mit begrenzten Slots, ausrüstbaren Waffen, Rüstung und Rucksäcken
- Rucksäcke erhöhen die Kapazität, Rüstung reduziert Schaden
- Lootspots mit Spawn-Chance, maximal einem Item und Gebäudetyp-spezifischen Itempools
- Itempools wie `residential_common`, `police_ammo`, `military_weapons`, `hospital_medical` und `industrial_tools`
- Zombies mit Wandern, Sicht, Geräuschreaktion, Verfolgung, Suche und Nahkampfangriff
- Waffen-Grundsystem mit Nahkampf, Pistole, Gewehr, Munition, Magazinen, Nachladen, Feuerrate und Geräuschradius
- HUD, Interaktionsanzeige und Inventar-Overlay
- Lokales Save-System über `localStorage` für Spielerposition, Werte, Inventar, ausgerüstete Items und Magazine

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können in den World-/Entity-Modulen ergänzt werden.
