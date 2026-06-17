import { useState } from 'react';
import GameCanvas from './game/GameCanvas';
import type { HudState } from './game/types';

const emptyClothing = { head: 'leer', torso: 'leer', legs: 'leer', feet: 'leer', hands: 'leer', vest: 'leer', backpack: 'leer' };
const initialHud: HudState = {
  hp: 100, stamina: 100, hunger: 88, thirst: 84, bleeding: false, infection: 0, infected: false, bodyTemperature: 37, wetness: 0, cold: 0, illness: 0, sick: false, pain: 0, unconscious: false, fracture: false,
  capacity: 10, usedSlots: 0, totalWeight: 0, armor: 0, warmth: 0, rainProtection: 0, weapon: 'Fäuste', weaponCondition: '-', ammo: 0, ammoText: 'Nahkampf', currentBackpack: 'Kein Rucksack', currentArmor: 'Keine Rüstung', clothing: emptyClothing,
  zombiesAlerted: 0, interactionPrompt: '', message: 'Klicke auf Start und danach ins Spiel, um die Maus zu sperren.', warning: '', inventoryOpen: false, craftingOpen: false, craftingRecipes: [], inventory: [], timeText: '08:15', weather: 'cloudy', noiseLevel: 'leise', actionLabel: '', actionProgress: 0, nearbyFireWarmth: 0, damageFlash: 0,
  worldPrompt: '', locationName: 'Wildnis', eventHint: '', compassHeading: '-', mapOpen: false, buildMode: false, selectedBuildable: 'Barrikade', storageOpen: false, storageTitle: '', storageUsed: 0, storageCapacity: 0, storageItems: []
};
const weatherLabels = { clear: 'klar', cloudy: 'bewölkt', rain: 'Regen', fog: 'Nebel' };
const slotLabels = { head: 'Kopf', torso: 'Oberkörper', legs: 'Beine', feet: 'Schuhe', hands: 'Hände', vest: 'Weste', backpack: 'Rucksack' };

export default function App() {
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState<HudState>(initialHud);

  if (!started) return (
    <main className="menu-screen"><section className="menu-panel"><p className="eyebrow">Hardcore Survival FPS Prototype</p><h1>Day-X</h1><p>Persistente Survival-Welt mit Türen, Containern, Basebuilding, Storage, Events, Horden und dezenter Orientierung. Eigenständiger Platzhalter-Prototyp ohne fremde Markenassets.</p><div className="menu-grid"><span>Persistente Türen</span><span>Container</span><span>Storage</span><span>Basebuilding</span><span>Events/Horden</span><span>Karte/Kompass</span></div><button onClick={() => setStarted(true)}>Prototyp starten</button><small>Tab: Inventar · K: Crafting · E: Interaktion · M: Karte · N/P: Bauen · O/I: Storage · F6/F9: Speichern/Laden</small></section></main>
  );

  return (
    <main className="game-screen">
      <GameCanvas onHudChange={setHud} />
      <section className="hud">
        <div className="meta-row"><span>Ort: {hud.locationName}</span><span>Kompass: {hud.compassHeading}</span><span>Zeit: {hud.timeText}</span><span>Wetter: {weatherLabels[hud.weather]}</span><span>Geräusch: {hud.noiseLevel}</span></div>
        <div className="stat"><span>HP</span><meter min="0" max="100" value={hud.hp} /><b>{hud.hp}</b></div>
        <div className="stat"><span>Ausdauer</span><meter min="0" max="100" value={hud.stamina} /><b>{hud.stamina}</b></div>
        <div className="stat"><span>Hunger</span><meter min="0" max="100" value={hud.hunger} /><b>{hud.hunger}</b></div>
        <div className="stat"><span>Durst</span><meter min="0" max="100" value={hud.thirst} /><b>{hud.thirst}</b></div>
        <div className="stat"><span>Temp.</span><meter min="32" max="38" value={hud.bodyTemperature} /><b>{hud.bodyTemperature}°</b></div>
        <div className="quick-row"><span className={hud.bleeding ? 'danger' : ''}>{hud.bleeding ? 'Blutung: JA' : 'Blutung: nein'}</span><span className={hud.infected ? 'danger' : ''}>Infektion: {hud.infection}%</span><span className={hud.sick ? 'danger' : ''}>Krankheit: {hud.illness}%</span><span>Schmerz: {hud.pain}%</span><span>Nässe: {hud.wetness}%</span><span>Kälte: {hud.cold}%</span></div>
        <div className="quick-row"><span>Waffe: {hud.weapon}</span><span>Zustand: {hud.weaponCondition}</span><span>Munition: {hud.ammoText}</span><span>Zombies alarmiert: {hud.zombiesAlerted}</span></div>
        <div className="quick-row"><span>Inventar: {hud.usedSlots}/{hud.capacity}</span><span>Gewicht: {hud.totalWeight} kg</span><span>Schutz: {Math.round(hud.armor * 100)}%</span><span>Wärme: {hud.warmth}</span><span>Regen: {hud.rainProtection}</span><span>Feuer: {hud.nearbyFireWarmth}%</span></div>
        {hud.buildMode ? <p className="interaction">Baumodus: {hud.selectedBuildable} · N wechseln · P platzieren</p> : null}
        {hud.worldPrompt ? <p className="interaction">{hud.worldPrompt}</p> : null}
        {hud.eventHint ? <p className="event-hint">{hud.eventHint}</p> : null}
        {hud.unconscious ? <p className="warning">Bewusstlosigkeit vorbereitet: kritischer Zustand.</p> : null}{hud.fracture ? <p className="warning">Knochenbruch vorbereitet: Sprinten eingeschränkt.</p> : null}{hud.warning ? <p className="warning">{hud.warning}</p> : null}
        {hud.actionLabel ? <div className="action-box"><span>{hud.actionLabel}</span><progress max="1" value={hud.actionProgress} /></div> : null}
        {hud.interactionPrompt ? <p className="interaction">{hud.interactionPrompt}</p> : null}
        <p className="message">{hud.message}</p>
      </section>

      {hud.inventoryOpen && <aside className="inventory"><h2>Inventar</h2><p className="inventory-help">1/2/3 Waffe · V Kleidung/Rüstung · B Rucksack · F/G/H nutzen · T reparieren · M Karte · N/P bauen · O/I Storage</p><div className="equipment-grid">{Object.entries(hud.clothing).map(([slot, value]) => <div key={slot}><strong>{slotLabels[slot as keyof typeof slotLabels]}</strong><span>{value}</span></div>)}</div>{hud.inventory.length === 0 ? <p>Leer. Suche Gebäude, Container oder Fahrzeuge ab.</p> : null}<ul>{hud.inventory.map((entry) => <li key={entry.id} className={entry.equipped ? 'equipped' : ''}><div><strong>{entry.name}</strong><small>{entry.type} · {entry.conditionLabel}{entry.freshness ? ` · ${entry.freshness}` : ''}</small><small>Slots: {entry.size} · Gewicht: {entry.totalWeight} kg</small><small>{entry.canUse ? 'verwendbar' : ''}{entry.canUse && entry.canEquip ? ' · ' : ''}{entry.canEquip ? 'ausrüstbar' : ''}</small></div><span>x{entry.count}{entry.equipped ? ' ✓' : ''}</span></li>)}</ul></aside>}
      {hud.craftingOpen && <aside className="crafting-panel"><h2>Crafting</h2><p className="inventory-help">Drücke 4-9 oder 0 für das entsprechende Rezept.</p><ol start={4}>{hud.craftingRecipes.map((recipe) => <li key={recipe.id} className={recipe.available ? 'available' : 'missing'}><strong>{recipe.name}</strong><small>{recipe.timeSeconds}s {recipe.available ? 'bereit' : `fehlt: ${recipe.missing.join(', ')}`}</small></li>)}</ol></aside>}
      {hud.storageOpen && <aside className="storage-panel"><h2>{hud.storageTitle}</h2><p className="inventory-help">O legt das erste nicht-ausgerüstete Item aus deinem Inventar hinein. I nimmt das erste Item heraus. Esc schließt.</p><p>Kapazität: {hud.storageUsed}/{hud.storageCapacity}</p>{hud.storageItems.length === 0 ? <p>Leer.</p> : null}<ul>{hud.storageItems.map((entry) => <li key={entry.id}><strong>{entry.name}</strong><span>x{entry.count}</span></li>)}</ul></aside>}
      {hud.mapOpen && <aside className="map-panel"><h2>Grobe Karte</h2><p>Nur Orientierung, keine Arcade-Marker.</p><div className="map-grid"><span>Siedlung</span><span>Supermarkt</span><span>Polizei</span><span>Klinik</span><span>Werkstatt</span><span>Militär</span><span>Funkturm</span><span>Bauernhof</span><span>Camping</span></div></aside>}
      <div className="crosshair" />{hud.damageFlash > 0 ? <div className="damage-flash" style={{ opacity: Math.min(0.45, hud.damageFlash * 0.45) }} /> : null}
    </main>
  );
}
