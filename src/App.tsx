import { useState } from 'react';
import GameCanvas from './game/GameCanvas';
import type { HudState } from './game/types';

const initialHud: HudState = {
  hp: 100,
  stamina: 100,
  hunger: 88,
  thirst: 84,
  bleeding: false,
  infection: 0,
  infected: false,
  capacity: 10,
  usedSlots: 0,
  armor: 0,
  weapon: 'Fäuste',
  ammo: 0,
  ammoText: 'Nahkampf',
  currentBackpack: 'Kein Rucksack',
  currentArmor: 'Keine Rüstung',
  zombiesAlerted: 0,
  interactionPrompt: '',
  message: 'Klicke auf Start und danach ins Spiel, um die Maus zu sperren.',
  warning: '',
  inventoryOpen: false,
  inventory: [],
  timeText: '08:15',
  weather: 'cloudy',
  noiseLevel: 'leise',
  damageFlash: 0
};

const weatherLabels = {
  clear: 'klar',
  cloudy: 'bewölkt',
  rain: 'Regen',
  fog: 'Nebel'
};

export default function App() {
  const [started, setStarted] = useState(false);
  const [hud, setHud] = useState<HudState>(initialHud);

  if (!started) {
    return (
      <main className="menu-screen">
        <section className="menu-panel">
          <p className="eyebrow">Hardcore Survival FPS Prototype</p>
          <h1>Day-X</h1>
          <p>
            Verlassene Siedlungen, knappe Ressourcen, gefährliche Infizierte und langsames taktisches Überleben.
            Alles ist ein eigenständiger Platzhalter-Prototyp ohne fremde Markenassets.
          </p>
          <div className="menu-grid">
            <span>Open-World-Prototyp</span>
            <span>Lootspots</span>
            <span>Tag / Nacht</span>
            <span>Wetter</span>
            <span>Inventar</span>
            <span>Zonen-Zombies</span>
          </div>
          <button onClick={() => setStarted(true)}>Prototyp starten</button>
          <small>Tab: Inventar · E: Aufheben · R: Nachladen · F/G/H: Essen/Trinken/Medizin · F6/F9: Speichern/Laden</small>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen">
      <GameCanvas onHudChange={setHud} />
      <section className="hud">
        <div className="meta-row">
          <span>Zeit: {hud.timeText}</span>
          <span>Wetter: {weatherLabels[hud.weather]}</span>
          <span>Geräusch: {hud.noiseLevel}</span>
        </div>
        <div className="stat"><span>HP</span><meter min="0" max="100" value={hud.hp} /><b>{hud.hp}</b></div>
        <div className="stat"><span>Ausdauer</span><meter min="0" max="100" value={hud.stamina} /><b>{hud.stamina}</b></div>
        <div className="stat"><span>Hunger</span><meter min="0" max="100" value={hud.hunger} /><b>{hud.hunger}</b></div>
        <div className="stat"><span>Durst</span><meter min="0" max="100" value={hud.thirst} /><b>{hud.thirst}</b></div>
        <div className="quick-row">
          <span className={hud.bleeding ? 'danger' : ''}>{hud.bleeding ? 'Blutung: JA' : 'Blutung: nein'}</span>
          <span>{hud.infected ? `Infektion: ${hud.infection}%` : 'Infektion: vorbereitet'}</span>
          <span>Rüstung: {Math.round(hud.armor * 100)}%</span>
          <span>Zombies alarmiert: {hud.zombiesAlerted}</span>
        </div>
        <div className="quick-row">
          <span>Waffe: {hud.weapon}</span>
          <span>Munition: {hud.ammoText}</span>
          <span>Inventar: {hud.usedSlots}/{hud.capacity}</span>
        </div>
        <div className="quick-row">
          <span>Rucksack: {hud.currentBackpack}</span>
          <span>Schutz: {hud.currentArmor}</span>
        </div>
        {hud.warning ? <p className="warning">{hud.warning}</p> : null}
        {hud.interactionPrompt ? <p className="interaction">{hud.interactionPrompt}</p> : null}
        <p className="message">{hud.message}</p>
      </section>
      {hud.inventoryOpen && (
        <aside className="inventory">
          <h2>Inventar</h2>
          <p className="inventory-help">F = beste Nahrung · G = bestes Getränk · H = Medizin · 1/2/3 = Waffe · V = beste Rüstung · B = bester Rucksack · F10 = Debug-Lootrespawn</p>
          {hud.inventory.length === 0 ? <p>Leer. Suche Gebäude ab.</p> : null}
          <ul>
            {hud.inventory.map((entry) => (
              <li key={entry.id} className={entry.equipped ? 'equipped' : ''}>
                <div>
                  <strong>{entry.name}</strong>
                  <small>{entry.type} · Slots/Gewicht vorbereitet: {entry.size}</small>
                  <small>{entry.canUse ? 'verwendbar' : ''}{entry.canUse && entry.canEquip ? ' · ' : ''}{entry.canEquip ? 'ausrüstbar' : ''}</small>
                </div>
                <span>x{entry.count}{entry.equipped ? ' ✓' : ''}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <div className="crosshair" />
      {hud.damageFlash > 0 ? <div className="damage-flash" style={{ opacity: Math.min(0.45, hud.damageFlash * 0.45) }} /> : null}
    </main>
  );
}
