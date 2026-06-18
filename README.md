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

## Asset- und Model-Upgrade

Dieser Branch nutzt keine externen Assets. Alle neuen Modelle und Icons sind eigene prozedurale Low-Poly-Assets aus Three.js-Primitiven oder Inline-SVGs.

Neue zentrale Dateien:

- `src/game/AssetRegistry.ts`: zentrale Zuordnung von Item-ID zu Modeltyp, Icon, Kategorie und Viewmodel-Konfiguration.
- `src/game/ItemModelFactory.ts`: erzeugt erkennbare 3D-Itemmodelle aus der Registry.
- `src/game/WorldObjectFactory.ts`: erzeugt bessere Low-Poly-Gebäude, Autos, Props, Türen, Container und Lootspots.
- `ASSETS.md`: dokumentiert, dass keine externen/lizenzpflichtigen Assets genutzt werden.

Verbessert wurden:

- Itemmodels für Nahrung, Getränke, Medizin, Waffen, Munition, Kleidung, Rucksäcke, Werkzeuge und Baumaterial.
- Inventar-Icons für jedes Item über sichere SVG-Data-URIs ohne kaputte Dateipfade.
- Icons im Grid, in Hotbar, Equipment, Storage-Liste, Itemdetails und Nähe-Items-Feld.
- First-Person-Viewmodels für Pistole, Gewehr, Messer, Beil, Brechstange und Holzspeer.
- Gebäude mit Fenstern, Türen, Dächern, Schildern und Fassadendetails.
- Ein mehrstöckiger Wohnblock als visueller Testblock mit Etagen-/Treppenhausdetails und zusätzlichen Wohnblock-Lootspots.
- Autos mit Karosserie, Rädern, Fenstern und Typunterschieden für Auto, Polizeiauto, Krankenwagen, Van und Militärtruck.
- Weltprops wie Lampen, Schilder, Bänke, Paletten, Fässer, Barrikaden und Müllsäcke.
- Lootspots sehen mehr wie Kisten/Behälter aus und tragen weiterhin die sichtbaren Itemmodelle.

Hinweis: Der mehrstöckige Wohnblock ist in diesem Schritt optisch und als Loot-/POI-Testblock vorbereitet. Eine echte mehrstöckige Spieler-Kollision/Treppenphysik ist noch nicht vollständig umgesetzt, weil die aktuelle Bewegungslogik den Spieler am Boden ankert.

## Debug-Steuerung

- F2: Respawn ohne Neuladen
- F3: God Mode ein-/ausschalten
- F4: Debug-Panel ein-/ausblenden
- F8: FPS-Anzeige ein-/ausschalten
- F10: Debug-Lootrespawn
- Debug-Panel: Testitems, Testloot am Spieler, Ammo-Cluster, Nonstack-Scatter, kleiner/großer Rucksack, Inventar leeren, Grid validieren, FPS umschalten

## Inventar-Steuerung

- Tab oder I: Grid-Inventar öffnen/schließen
- Linksklick: Item auswählen
- Rechtsklick auf Item: Kontextmenü
- Drag-and-Drop: Item im Grid verschieben
- R während des Ziehens: Item-Rotation umschalten
- Drop auf Ausrüstungsslot: Item ausrüsten, wenn passend
- Drop auf Hotbar 1-5: Hotbar-Referenz setzen
- Drag aus “Nahe Items” ins Grid: Weltitem an Zielposition aufnehmen, sofern gültig
- Doppelklick/Button in “Nahe Items”: Weltitem automatisch aufnehmen

## Normale Steuerung

- WASD: Bewegen
- Maus: Blickrichtung
- Linksklick: Nahkampf / Schießen
- Shift: Sprinten
- C oder Strg: Schleichen
- Space: Springen
- E: Loot, Weltitems, Türen, Container, Fahrzeuge oder Storage-Kisten interagieren
- 1-5: Hotbar / Schnellzugriff
- X: ausgewähltes oder erstes Inventaritem droppen
- K: Crafting-Menü öffnen/schließen
- 4-9 und 0: sichtbare Crafting-Rezepte ausführen, wenn Crafting geöffnet ist
- M: Karte öffnen/schließen, wenn Karte im Inventar ist
- N: Basebuilding-Bauteil wechseln und Baumodus aktivieren
- P: gewähltes Basebuilding-Element platzieren
- O: erstes nicht-ausgerüstetes Item in offene Storage-Kiste legen
- Esc: Inventar/Storage schließen
- R: Ausgerüstete Schusswaffe nachladen, wenn kein Item gezogen wird
- V: beste Rüstung/Kleidung ausrüsten
- B: besten Rucksack ausrüsten
- F: beste Nahrung essen
- G: bestes Getränk trinken
- H: Medizin verwenden
- T: beschädigtes ausgerüstetes Item reparieren
- Y: Lagerfeuer platzieren und anzünden
- F6: Spielstand speichern
- F9: Spielstand laden

## Grid-Inventar-System

- Jedes Item ist eine eigene Instanz mit eindeutiger `instanceId`.
- Itemtyp und Iteminstanz sind getrennt: Itemtypen liegen weiter zentral in `src/game/data.ts`, Instanzen liegen im Inventar-Save.
- Das Spielerinventar ist ein echtes Raster.
- Items haben Gridgrößen wie 1x1, 1x2, 2x2, 3x2, 3x3 und 6x2.
- Items können nicht überlappen und nicht außerhalb des Grids platziert werden.
- Platzierung wird in `src/game/InventoryGrid.ts` unabhängig von der UI geprüft.
- Stackbare Items füllen zuerst vorhandene Stacks auf.
- Restmengen bleiben in der Welt, wenn das Grid voll ist.
- Stacks können geteilt werden.
- Rotation wird gespeichert.
- Rucksäcke ändern die echte Gridgröße:
  - kein Rucksack: 5x4
  - kleiner Rucksack: 6x5
  - mittlerer/improvisierter Rucksack: 7x6
  - großer Militärrucksack: 8x8
- Rucksack-Wechsel wird verhindert, wenn das kleinere Grid die vorhandenen Items nicht tragen kann.
- Hotbar referenziert Iteminstanzen und dupliziert keine Items.
- Ausrüstungsslots akzeptieren nur passende Items.
- Save/Load speichert Gridposition, Rotation, Stackmenge, Zustand, Ausrüstung, Hotbar und gedroppte WorldItems.

## Design-Regel

Das Projekt nutzt ausschließlich eigene prozedurale Low-Poly-Modelle und generierte SVG-Icons. Spätere echte 3D-Modelle können über die zentralen Registries durch `.glb/.gltf`-Modelle und Icon-Dateien ersetzt werden.
