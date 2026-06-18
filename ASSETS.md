# Asset- und Lizenznotizen

Dieser Branch verwendet keine extern heruntergeladenen 3D-Modelle, Texturen, Sounds, Icons oder geschützten Assets.

## Aktuelle Asset-Strategie

- Alle Item-Modelle werden prozedural aus Three.js-Primitiven erzeugt.
- Alle Weltobjekte wie Gebäude, Autos, Lootspots und Props werden prozedural aus eigenen Low-Poly-Formen erzeugt.
- Inventar-Icons werden als eigene Inline-SVG-Data-URIs durch `AssetRegistry` generiert.
- Es gibt keine Dateipfade zu externen `.glb`, `.gltf`, `.png` oder `.svg` Dateien.
- Savegames speichern nur IDs, Positionen, Zustände und Mengen, keine Mesh- oder Bilddaten.

## Austauschbarkeit

Die zentrale Zuordnung liegt in:

- `src/game/AssetRegistry.ts`
- `src/game/ItemModelFactory.ts`
- `src/game/WorldObjectFactory.ts`

Spätere echte Assets können dort über Model-/Icon-Pfade ergänzt werden, ohne Itemdaten oder Savegames umzubauen.

## Lizenzstatus

Da in diesem Branch ausschließlich selbst erzeugte prozedurale Modelle und selbst generierte SVG-Icons genutzt werden, sind keine externen Lizenzangaben erforderlich.

## Stilrichtlinie

- Low-Poly bis mittel-detailliert
- düster, dreckig, postapokalyptisch
- keine bunten Arcade-Farben
- klare Silhouetten
- browserfreundliche Polycounts
