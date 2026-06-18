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

## Bugfixes und Komfortfeatures dieses Schritts

- Grid-Drag-and-Drop hat jetzt eine eigene Live-Vorschau.
- Gültige Zielzellen werden grün markiert.
- Ungültige Zielzellen werden rot markiert.
- Beim Prüfen wird die ursprüngliche Iteminstanz korrekt ignoriert, damit ein Item nicht mit sich selbst kollidiert.
- “Ungültige Gridposition” entsteht nur noch bei echter Kollision, außerhalb des Grids oder wenn Größe/Rotation nicht passt.
- Rucksäcke werden beim Aufheben automatisch ausgerüstet, wenn noch kein Rucksack getragen wird.
- Ein weiterer Rucksack ersetzt den vorhandenen Rucksack nicht automatisch, sondern bleibt ein normales Grid-Item.
- WorldItems werden mit Scatter-Positionen verteilt und nicht mehr exakt übereinander gelegt.
- Gleiche stackbare WorldItems werden bis zur MaxStack-Grenze zusammengefasst.
- Nicht-stackbare Items bleiben einzeln und werden mit Abstand verteilt.
- Das Inventar zeigt ein Feld “Nahe Items” für WorldItems in der Umgebung.
- Nahe Items können per Drag-and-Drop oder Button/Doppelklick aufgenommen werden.
- FPS-Anzeige mit geglätteter Anzeige und Frame-Time wurde ergänzt.
- Debug-Validierung warnt bei Gridfehlern, ungültigen Hotbar-Referenzen und zu nahen WorldItems.

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

## Weitere Prototyp-Inhalte

- Debug-System mit Respawn-Button, God-Mode-Button, Spielerposition, Zombie-Anzahl, Lootspot-Anzahl und gedroppten Items
- Sichtbare humanoide Zombie-Modelle aus eigenen Low-Poly-Primitives mit Kopf, Torso, Armen, Beinen, gebeugter Haltung und einfacher Code-Animation
- Sichtbare Item-Modelle in der Welt für Nahrung, Getränke, Medizin, Waffen, Munition, Ausrüstung, Kleidung, Rucksäcke und Werkzeuge
- First-Person-Viewmodel-System für ausgerüstete Waffen/Nahkampfwaffen und leere Hände
- Bestehende Open-World-Platzhalterkarte, Lootspots, Zombies, Survivalwerte, Kleidung, Reparatur, Crafting, Lagerfeuer, Türen, Container, Fahrzeuge, Basebuilding, Storage, Events, Horden und Orientierung
- Persistentes Save-System über `localStorage`
- Zentrale Modellzuordnung: `src/game/ItemModelFactory.ts`
- First-Person-Viewmodel: `src/game/FirstPersonViewModelSystem.ts`
- Weltitems/Drop/Pickup: `src/game/ItemWorldSystem.ts`
- Zombie-Modelle: `src/game/ZombieModelFactory.ts`
- Grid-Logik: `src/game/InventoryGrid.ts`
- Inventar-Instanzlogik: `src/game/Inventory.ts`
- Zentrale Balancing-Datei: `src/game/Balance.ts`

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können über die Model-Factories durch `.glb/.gltf`-Modelle ersetzt werden.
