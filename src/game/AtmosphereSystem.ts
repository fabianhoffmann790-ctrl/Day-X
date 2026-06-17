import * as THREE from 'three';
import { BALANCE } from './Balance';
import type { WeatherType } from './types';

const WEATHER_SEQUENCE: WeatherType[] = ['clear', 'cloudy', 'rain', 'fog'];

export class AtmosphereSystem {
  public timeOfDay = BALANCE.dayNight.startTime;
  public weather: WeatherType = 'cloudy';

  private weatherTimer = 0;
  private rain: THREE.Points | null = null;
  private readonly rainPositions: Float32Array;

  constructor(
    private scene: THREE.Scene,
    private ambient: THREE.HemisphereLight,
    private sun: THREE.DirectionalLight
  ) {
    this.rainPositions = new Float32Array(360 * 3);
    this.createRain();
    this.applyLighting();
  }

  update(delta: number, playerPosition: THREE.Vector3) {
    this.timeOfDay = (this.timeOfDay + (24 / BALANCE.dayNight.dayLengthSeconds) * delta) % 24;
    this.weatherTimer += delta;
    if (this.weatherTimer >= BALANCE.weather.changeCheckSeconds) {
      this.weatherTimer = 0;
      if (Math.random() < BALANCE.weather.changeChance) this.rollWeather();
    }

    this.updateRain(delta, playerPosition);
    this.applyLighting();
  }

  setState(timeOfDay: number, weather: WeatherType) {
    this.timeOfDay = Number.isFinite(timeOfDay) ? timeOfDay % 24 : BALANCE.dayNight.startTime;
    this.weather = weather;
    this.applyLighting();
  }

  isNight() {
    return this.timeOfDay >= BALANCE.dayNight.nightStartHour || this.timeOfDay <= BALANCE.dayNight.nightEndHour;
  }

  timeText() {
    const hour = Math.floor(this.timeOfDay);
    const minute = Math.floor((this.timeOfDay - hour) * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  private rollWeather() {
    const currentIndex = WEATHER_SEQUENCE.indexOf(this.weather);
    const nextIndex = Math.floor(Math.random() * WEATHER_SEQUENCE.length);
    this.weather = WEATHER_SEQUENCE[nextIndex === currentIndex ? (nextIndex + 1) % WEATHER_SEQUENCE.length : nextIndex];
  }

  private createRain() {
    for (let i = 0; i < this.rainPositions.length; i += 3) {
      this.rainPositions[i] = (Math.random() - 0.5) * 85;
      this.rainPositions[i + 1] = 6 + Math.random() * 22;
      this.rainPositions[i + 2] = (Math.random() - 0.5) * 85;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const material = new THREE.PointsMaterial({ color: 0x9aa8a8, size: 0.055, transparent: true, opacity: 0.52 });
    this.rain = new THREE.Points(geometry, material);
    this.rain.visible = false;
    this.scene.add(this.rain);
  }

  private updateRain(delta: number, playerPosition: THREE.Vector3) {
    if (!this.rain) return;
    this.rain.visible = this.weather === 'rain';
    if (!this.rain.visible) return;

    this.rain.position.set(playerPosition.x, 0, playerPosition.z);
    for (let i = 1; i < this.rainPositions.length; i += 3) {
      this.rainPositions[i] -= 18 * delta;
      if (this.rainPositions[i] < 0.2) this.rainPositions[i] = 15 + Math.random() * 16;
    }
    const positionAttribute = this.rain.geometry.getAttribute('position');
    positionAttribute.needsUpdate = true;
  }

  private applyLighting() {
    const night = this.isNight();
    const dawnDusk = this.timeOfDay < 7 || this.timeOfDay > 18;
    const weatherLightModifier = this.weather === 'clear' ? 1 : this.weather === 'cloudy' ? 0.78 : this.weather === 'rain' ? 0.62 : 0.48;
    const daylight = night ? 0.18 : dawnDusk ? 0.55 : 1;
    const intensity = daylight * weatherLightModifier;

    this.ambient.intensity = 0.22 + intensity * 0.95;
    this.sun.intensity = 0.15 + intensity * 1.45;
    this.sun.color.set(night ? 0x8fa6c7 : dawnDusk ? 0xffc98f : 0xf1e6c8);

    const fogColor = night ? 0x070b0c : this.weather === 'fog' ? 0x88908c : this.weather === 'rain' ? 0x4b5553 : 0x111611;
    const fogNear = night ? 10 : this.weather === 'fog' ? 8 : 20;
    const fogFar = this.weather === 'clear'
      ? BALANCE.weather.fogFarClear
      : this.weather === 'cloudy'
        ? BALANCE.weather.fogFarCloudy
        : this.weather === 'rain'
          ? BALANCE.weather.fogFarRain
          : BALANCE.weather.fogFarFog;

    this.scene.background = new THREE.Color(fogColor);
    this.scene.fog = new THREE.Fog(fogColor, fogNear, night ? Math.min(fogFar, 72) : fogFar);
  }
}
