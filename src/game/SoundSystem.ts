type SoundEvent =
  | 'footstep'
  | 'sprint'
  | 'zombie_idle'
  | 'zombie_attack'
  | 'gunshot'
  | 'reload'
  | 'pickup'
  | 'consume'
  | 'inventory'
  | 'injury';

const FREQUENCIES: Record<SoundEvent, number> = {
  footstep: 110,
  sprint: 145,
  zombie_idle: 70,
  zombie_attack: 95,
  gunshot: 260,
  reload: 180,
  pickup: 420,
  consume: 240,
  inventory: 300,
  injury: 85
};

export class SoundSystem {
  private context: AudioContext | null = null;
  private lastPlayed = new Map<SoundEvent, number>();

  unlock() {
    if (this.context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
  }

  play(event: SoundEvent, intensity = 0.25) {
    const now = performance.now();
    const last = this.lastPlayed.get(event) ?? 0;
    if (now - last < 90) return;
    this.lastPlayed.set(event, now);

    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = FREQUENCIES[event];
    oscillator.type = event === 'gunshot' || event === 'injury' ? 'sawtooth' : 'triangle';
    gain.gain.value = Math.max(0.01, Math.min(0.12, intensity * 0.12));
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + (event === 'gunshot' ? 0.08 : 0.04));
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
