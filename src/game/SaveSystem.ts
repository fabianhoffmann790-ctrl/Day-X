import type { InventorySaveData, PlayerVitals, SaveGameState, WeatherType } from './types';

const SAVE_KEY = 'day-x.prototype.save.v1';
const VALID_WEATHER: WeatherType[] = ['clear', 'cloudy', 'rain', 'fog'];

export class SaveSystem {
  static save(payload: Omit<SaveGameState, 'version' | 'savedAt'>) {
    const saveGame: SaveGameState = {
      version: 1,
      savedAt: Date.now(),
      ...payload
    };

    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveGame));
      return true;
    } catch {
      return false;
    }
  }

  static load(): SaveGameState | null {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SaveGameState;
      if (parsed.version !== 1) return null;
      if (!isValidVitals(parsed.stats) || !isValidInventory(parsed.inventory)) return null;
      if (!Array.isArray(parsed.lootSpots)) parsed.lootSpots = [];
      if (typeof parsed.timeOfDay !== 'number') parsed.timeOfDay = 8.25;
      if (!VALID_WEATHER.includes(parsed.weather)) parsed.weather = 'cloudy';
      if (!parsed.magazines) parsed.magazines = {};
      if (!Array.isArray(parsed.campfires)) parsed.campfires = [];
      return parsed;
    } catch {
      return null;
    }
  }

  static clear() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}

function isValidVitals(value: PlayerVitals | undefined): value is PlayerVitals {
  return Boolean(value)
    && typeof value.hp === 'number'
    && typeof value.stamina === 'number'
    && typeof value.hunger === 'number'
    && typeof value.thirst === 'number'
    && typeof value.bleeding === 'boolean';
}

function isValidInventory(value: InventorySaveData | undefined): value is InventorySaveData {
  return Boolean(value) && Array.isArray(value.items);
}
