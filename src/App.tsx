import { useState } from 'react';
import GameCanvas from './game/GameCanvas';
import type { HudState, InventoryEntry } from './game/types';

const emptyClothing = { head: 'leer', torso: 'leer', legs: 'leer', feet: 'leer', hands: 'leer', vest: 'leer', backpack: 'leer' };
const initialHud: HudState = {
  hp: 100, stamina: 100, hunger: 88, thirst: 84, bleeding: false, infection: 0, infected: false, bodyTemperature: 37, wetness: 0, cold: 0, illness: 0, sick: false, pain: 0, unconscious: false, fracture: false,
  capacity: 10, usedSlots: 0, totalWeight: 0, armor: 0, warmth: 0, rainProtection: 0, weapon: 'Fäuste', weaponCondition: '-', ammo: 0, ammoText: 'Nahkampf', currentBackpack: 'Kein Rucksack', currentArmor: 'Keine Rüstung', clothing: emptyClothing,
  zombiesAlerted: 0, interactionPrompt: '', message: 'Klicke auf Start und danach ins Spiel, um die Maus zu sperren.', warning: '', inventoryOpen: false, craftingOpen: false, craftingRecipes: [], inventory: [], selectedItemId: null, hotbar: [], debug: { godMode: false, debugPanelOpen: true, playerPosition: '-', zombieCount: 0, lootSpotCount: 0, droppedItemCount: 0 },
  timeText: '08:15', weather: 'cloudy', noiseLevel: 'leise', actionLabel: '', actionProgress: 0, nearbyFireWarmth: 0, damageFlash: 0,
  worldPrompt: '', locationName: 'Wildnis', eventHint: '', compassHeading: '-', mapOpen: false, buildMode: false, selectedBuildable: 'Barrikade', storageOpen: false, storageTitle: '', storageUsed: 0, storageCapacity: 0, storageItems: []
};
const weatherLabels = { clear: 'klar', cloudy: 'bewölkt', rain: 'Regen', fog: 'Nebel' };
const slotLabels = { head: 'Kopf', torso: 'Oberkörper', legs: 'Beine', feet: 'Schuhe', hands: 'Hände', vest: 'Weste', backpack: 'Rucksack' };

function sendKey(code: string) { window.dispatchEvent(new KeyboardEvent('keydown', { code })); }
function inventoryAction(type: string, itemId?: string, slot?: number) { window.dispatchEvent(new CustomEvent('dayx-inventory-action', { detail: { type, itemId, slot } })); }
function categoryLabel(entry: InventoryEntry) { return `${entry.type} · ${entry.conditionLabel} · ${entry.totalWeight} kg`; }

export default function App() {
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState<HudState>(initialHud);
  const selectedItem = hud.inventory.find((entry) => entry.id === hud.selectedItemId) ?? hud.inventory[0];

  if (!started) return (
    <main className="menu-screen"><section className="menu-panel"><p className="eyebrow">Hardcore Survival FPS Prototype</p><h1>Day-X</h1><p>Testbarer Survival-Prototyp mit Debug-Respawn, God Mode, sichtbaren Zombie-/Item-Modellen, Hotbar, Dropped Items und First-Person-Viewmodel.</p><div className="menu-grid"><span>Debug</span><span>Hotbar</span><span>Viewmodel</span><span>Weltitems</span><span>Inventar</span><span>Zombie-Models</span></div><button onClick={() => setStarted(true)}>Prototyp starten</button><small>F2 Respawn · F3 God Mode · F4 Debug · Tab Inventar · E Aufheben/Interaktion · 1-5 Hotbar · X Drop</small></section></main>
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
        <div className="hotbar">{hud.hotbar.map((slot) => <button key={slot.slot} onClick={() => sendKey(`Digit${slot.slot}`)} className={slot.itemId && slot.itemId === hud.selectedItemId ? 'active' : ''}><b>{slot.slot}</b><span>{slot.label}</span></button>)}</div>
        {hud.buildMode ? <p className="interaction">Baumodus: {hud.selectedBuildable} · N wechseln · P platzieren</p> : null}{hud.worldPrompt ? <p className="interaction">{hud.worldPrompt}</p> : null}{hud.interactionPrompt ? <p className="interaction">{hud.interactionPrompt}</p> : null}{hud.eventHint ? <p className="event-hint">{hud.eventHint}</p> : null}{hud.warning ? <p className="warning">{hud.warning}</p> : null}
        {hud.actionLabel ? <div className="action-box"><span>{hud.actionLabel}</span><progress max="1" value={hud.actionProgress} /></div> : null}
        <p className="message">{hud.message}</p>
      </section>

      {hud.debug.debugPanelOpen && <aside className="debug-panel"><h2>Debug</h2><button onClick={() => sendKey('F2')}>Respawn</button><button onClick={() => sendKey('F3')}>{hud.debug.godMode ? 'God Mode AUS' : 'God Mode AN'}</button><button onClick={() => sendKey('F10')}>Loot neu</button><p>God Mode: <b>{hud.debug.godMode ? 'AKTIV' : 'aus'}</b></p><p>Position: {hud.debug.playerPosition}</p><p>Zombies: {hud.debug.zombieCount}</p><p>Lootspots: {hud.debug.lootSpotCount}</p><p>Gedroppte Items: {hud.debug.droppedItemCount}</p></aside>}

      {hud.inventoryOpen && <aside className="inventory"><h2>Inventar</h2><p className="inventory-help">Mausbedienung aktiv. Aktionen: benutzen, ausrüsten, droppen, entfernen, verschieben, Hotbar setzen.</p><div className="equipment-grid">{Object.entries(hud.clothing).map(([slot, value]) => <div key={slot}><strong>{slotLabels[slot as keyof typeof slotLabels]}</strong><span>{value}</span></div>)}</div>{selectedItem ? <div className="item-details"><h3>{selectedItem.name}</h3><p>{categoryLabel(selectedItem)}</p><p>{selectedItem.description}</p><div className="action-buttons"><button onClick={() => inventoryAction('use', selectedItem.id)}>Benutzen</button><button onClick={() => inventoryAction('equip', selectedItem.id)}>Ausrüsten</button><button onClick={() => inventoryAction('drop', selectedItem.id)}>Drop</button><button onClick={() => inventoryAction('delete', selectedItem.id)}>Wegwerfen</button><button onClick={() => inventoryAction('move_up', selectedItem.id)}>↑</button><button onClick={() => inventoryAction('move_down', selectedItem.id)}>↓</button>{[1, 2, 3, 4, 5].map((slot) => <button key={slot} onClick={() => inventoryAction('hotbar', selectedItem.id, slot)}>HB {slot}</button>)}</div></div> : null}{hud.inventory.length === 0 ? <p>Leer. Suche Gebäude, Container oder Fahrzeuge ab.</p> : null}<ul>{hud.inventory.map((entry) => <li key={entry.id} className={`${entry.equipped ? 'equipped' : ''} ${entry.id === hud.selectedItemId ? 'selected' : ''}`} onClick={() => inventoryAction('hotbar', entry.id, 5)}><div><strong>{entry.name}</strong><small>{categoryLabel(entry)}</small><small>{entry.canUse ? 'verwendbar' : ''}{entry.canUse && entry.canEquip ? ' · ' : ''}{entry.canEquip ? 'ausrüstbar' : ''}</small></div><span>x{entry.count}{entry.equipped ? ' ✓' : ''}</span></li>)}</ul></aside>}
      {hud.craftingOpen && <aside className="crafting-panel"><h2>Crafting</h2><p className="inventory-help">Drücke 4-9 oder 0 für das entsprechende Rezept.</p><ol start={4}>{hud.craftingRecipes.map((recipe) => <li key={recipe.id} className={recipe.available ? 'available' : 'missing'}><strong>{recipe.name}</strong><small>{recipe.timeSeconds}s {recipe.available ? 'bereit' : `fehlt: ${recipe.missing.join(', ')}`}</small></li>)}</ol></aside>}
      {hud.storageOpen && <aside className="storage-panel"><h2>{hud.storageTitle}</h2><p className="inventory-help">O legt das erste nicht-ausgerüstete Item hinein. I nimmt das erste Item heraus. Esc schließt.</p><p>Kapazität: {hud.storageUsed}/{hud.storageCapacity}</p>{hud.storageItems.length === 0 ? <p>Leer.</p> : null}<ul>{hud.storageItems.map((entry) => <li key={entry.id}><strong>{entry.name}</strong><span>x{entry.count}</span></li>)}</ul></aside>}
      {hud.mapOpen && <aside className="map-panel"><h2>Grobe Karte</h2><p>Nur Orientierung, keine Arcade-Marker.</p><div className="map-grid"><span>Siedlung</span><span>Supermarkt</span><span>Polizei</span><span>Klinik</span><span>Werkstatt</span><span>Militär</span><span>Funkturm</span><span>Bauernhof</span><span>Camping</span></div></aside>}
      <div className="crosshair" />{hud.damageFlash > 0 ? <div className="damage-flash" style={{ opacity: Math.min(0.45, hud.damageFlash * 0.45) }} /> : null}
    </main>
  );
}
