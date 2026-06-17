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
- F10: Debug-Lootrespawn

Respawn setzt Position, Kamera, HP, Ausdauer, Blutung und kritische Zustände zurück. God Mode blockiert Schaden durch Zombies und Survival-Schaden.

## Steuerung

- WASD: Bewegen
- Maus: Blickrichtung
- Linksklick: Nahkampf / Schießen
- Shift: Sprinten
- C oder Strg: Schleichen
- Space: Springen
- E: Loot, Weltitems, Türen, Container, Fahrzeuge oder Storage-Kisten interagieren
- Tab: Inventar ein-/ausblenden und Mausbedienung aktivieren
- 1-5: Hotbar / Schnellzugriff
- X: ausgewähltes oder erstes Inventaritem droppen
- K: Crafting-Menü öffnen/schließen
- 4-9 und 0: sichtbare Crafting-Rezepte ausführen, wenn Crafting geöffnet ist
- M: Karte öffnen/schließen, wenn Karte im Inventar ist
- N: Basebuilding-Bauteil wechseln und Baumodus aktivieren
- P: gewähltes Basebuilding-Element platzieren
- O: erstes nicht-ausgerüstetes Item in offene Storage-Kiste legen
- I: erstes Item aus offener Storage-Kiste ins Inventar nehmen
- Esc: Storage-Kiste schließen
- R: Ausgerüstete Schusswaffe nachladen
- V: beste Rüstung/Kleidung ausrüsten
- B: besten Rucksack ausrüsten
- F: beste Nahrung essen
- G: bestes Getränk trinken
- H: Medizin verwenden
- T: beschädigtes ausgerüstetes Item reparieren
- Y: Lagerfeuer platzieren und anzünden
- F6: Spielstand speichern
- F9: Spielstand laden

## Prototyp-Inhalt

- Debug-System mit Respawn-Button, God-Mode-Button, Debug-Panel, Spielerposition, Zombie-Anzahl, Lootspot-Anzahl und gedroppten Items
- Sichtbare humanoide Zombie-Modelle aus eigenen Low-Poly-Primitives mit Kopf, Torso, Armen, Beinen, gebeugter Haltung und einfacher Code-Animation
- Sichtbare Item-Modelle in der Welt für Nahrung, Getränke, Medizin, Waffen, Munition, Ausrüstung, Kleidung, Rucksäcke und Werkzeuge
- Dropped-Item-System: Inventaritems können als 3D-Objekt vor dem Spieler abgelegt und wieder mit E aufgehoben werden
- First-Person-Viewmodel-System für ausgerüstete Pistole, Gewehr, Messer, Axt, Brecheisen und leere Hände
- Viewmodel-Feedback: Idle-Bob, Laufbewegung, Sprint-Absenkung, Rückstoß, Nachladen und Nahkampf-Schwingen als Platzhalteranimation
- Hotbar mit Slots 1 bis 5 und UI-Anzeige
- Mausbedienbare Inventar-UI mit Itemdetails, Benutzen, Ausrüsten, Drop, Wegwerfen, Verschieben und Hotbar-Zuweisung
- Inventar zeigt Name, Kategorie, Zustand, Gewicht, Effektbeschreibung und Ausrüstung
- Bestehende Open-World-Platzhalterkarte mit Siedlung, Straßen, Waldstücken, Feldern, Fahrzeugwracks, Zäunen, Klinik, Polizei, Supermarkt, Werkstatt/Lagerhalle und Militär-Checkpoint
- Betretbare Platzhalter-Gebäude mit dunkleren Innenbereichen, Eingängen und passenden Lootspots
- HP, Ausdauer, Hunger, Durst, Blutung, Infektion, Krankheit, Schmerz, Nässe, Kälte und Körpertemperatur
- Kleidungssystem mit Slots: Kopf, Oberkörper, Beine, Schuhe, Hände, Weste/Rüstung und Rucksack
- Items haben Zustand, Gewicht und Gameplay-Wirkung
- Reparatursystem, Crafting-System und Lagerfeuer-System
- Türen-, Zugangssystem, Container-System, Fahrzeug-Kofferäume, Basebuilding, Storage, Events, Horden, Hinweise und Orientierung
- Persistentes Save-System über `localStorage` für Spielerposition, Statuswerte, Inventar, Hotbar, Ausrüstung, gedroppte Weltitems, Lootspots, Türen, Container, platzierte Objekte, Storage, Events, Horden, Tageszeit, Wetter und Lagerfeuer
- Zentrale Modellzuordnung: `src/game/ItemModelFactory.ts`
- First-Person-Viewmodel: `src/game/FirstPersonViewModelSystem.ts`
- Weltitems/Drop/Pickup: `src/game/ItemWorldSystem.ts`
- Zombie-Modelle: `src/game/ZombieModelFactory.ts`
- Zentrale Balancing-Datei: `src/game/Balance.ts`

## Design-Regel

Das Projekt nutzt ausschließlich primitive Platzhalter-Assets. Spätere echte 3D-Modelle können über die Model-Factories durch `.glb/.gltf`-Modelle ersetzt werden.
