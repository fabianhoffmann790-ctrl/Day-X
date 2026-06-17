import { useState } from 'react';
import GameCanvas from './game/GameCanvas';
import type { HudState } from './game/types';

const initialHud: HudState = {
  hp: 100,
  stamina: 100,
  hunger: 86,
  thirst: 82,
  bleeding: false,
  capacity: 10,
  usedSlots: 0,
  armor: 0,
  weapon: 'Fäuste',
  ammo: 0,
  zombiesAlerted: 0,
  message: 'Klicke auf Start und danach ins Spiel, um die Maus zu sperren.',
  inventoryOpen: false,
  inventory: []
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
            <span>First-Person</span>
            <span>Lootspots</span>
            <span>Hunger / Durst</span>
            <span>Zombie-KI</span>
            <span>Inventar</span>
            <span>Waffen</span>
          </div>
          <button onClick={() => setStarted(true)}>Prototyp starten</button>
          <small>Hinweis: Im Spiel Tab für Inventar, E zum Looten, Linksklick zum Kämpfen.</small>
        </section>
      </main>
    );
  }

  return (
    <main className="game-screen">
      <GameCanvas onHudChange={setHud} />
      <section className="hud">
        <div className="stat"><span>HP</span><meter min="0" max="100" value={hud.hp} /></div>
        <div className="stat"><span>Ausdauer</span><meter min="0" max="100" value={hud.stamina} /></div>
        <div className="stat"><span>Hunger</span><meter min="0" max="100" value={hud.hunger} /></div>
        <div className="stat"><span>Durst</span><meter min="0" max="100" value={hud.thirst} /></div>
        <div className="quick-row">
          <span>{hud.bleeding ? 'Blutung: JA' : 'Blutung: nein'}</span>
          <span>Rüstung: {Math.round(hud.armor * 100)}%</span>
          <span>Zombies alarmiert: {hud.zombiesAlerted}</span>
        </div>
        <div className="quick-row">
          <span>Waffe: {hud.weapon}</span>
          <span>Munition: {hud.ammo}</span>
          <span>Inventar: {hud.usedSlots}/{hud.capacity}</span>
        </div>
        <p className="message">{hud.message}</p>
      </section>
      {hud.inventoryOpen && (
        <aside className="inventory">
          <h2>Inventar</h2>
          {hud.inventory.length === 0 ? <p>Leer. Suche Gebäude ab.</p> : null}
          <ul>
            {hud.inventory.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.name}</strong>
                <span>x{entry.count}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <div className="crosshair" />
    </main>
  );
}
