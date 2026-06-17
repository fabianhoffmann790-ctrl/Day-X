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
- Linksklick: Angreifen / Schießen
- Shift: Sprinten
- C oder Strg: Schleichen
- Space: Springen
- E: Lootspot durchsuchen
- Tab: Inventar ein-/ausblenden
- R: Nachladen / Munitionsprüfung
- 1/2/3: Waffe wechseln, wenn vorhanden

## Prototyp-Inhalt

- Hauptmenü
- Three.js-Spielwelt mit Platzhalter-Gebäuden
- First-Person-Controller mit Pointer Lock
- HP, Ausdauer, Hunger, Durst, Blutung
- Inventar mit Kapazität, Rucksäcken, Kleidung/Rüstung
- Lootspots mit Gebäudetyp-spezifischen Itempools
- Zombies mit Sicht-/Geräuschreaktion und Nahkampfangriff
- Waffen-Grundsystem für Nahkampf und einfache Schusswaffen
- HUD und Inventar-Overlay

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können in den World-/Entity-Modulen ergänzt werden.
