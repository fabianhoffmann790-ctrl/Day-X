import * as THREE from 'three';
import { AtmosphereSystem } from './AtmosphereSystem';
import { BALANCE } from './Balance';
import { ITEMS } from './data';
import { Inventory } from './Inventory';
import { LootSystem } from './LootSystem';
import { applyDamage, applyItemEffects, cloneDefaultVitals, updatePlayerVitals } from './PlayerStats';
import { SaveSystem } from './SaveSystem';
import { SoundSystem } from './SoundSystem';
import { WorldBuilder, type WorldLootSpot } from './WorldBuilder';
import { Zombie } from './Zombie';
import { ZombieSpawner } from './ZombieSpawner';
import type { HudState, PlayerVitals, SpawnZoneDefinition } from './types';

type KeyMap = Record<string, boolean>;

export class GameEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private keys: KeyMap = {};
  private zombies: Zombie[] = [];
  private lootSpots: WorldLootSpot[] = [];
  private spawnZones: SpawnZoneDefinition[] = [];
  private inventory = new Inventory();
  private loot = new LootSystem();
  private sound = new SoundSystem();
  private atmosphere!: AtmosphereSystem;
  private clock = new THREE.Clock();
  private raycaster = new THREE.Raycaster();
  private animationId = 0;
  private yaw = 0;
  private pitch = 0;
  private verticalVelocity = 0;
  private grounded = true;
  private noiseRadius = 0;
  private noiseLabel = 'leise';
  private message = 'Suche Gebäude ab. Schleichen ist oft sicherer als Kämpfen.';
  private interactionPrompt = '';
  private warning = '';
  private inventoryOpen = false;
  private stats: PlayerVitals = cloneDefaultVitals();
  private lastPrimaryAttack = 0;
  private reloadTimer = 0;
  private autoSaveTimer = 0;
  private stepTimer = 0;
  private damageFlash = 0;
  private hoveredLoot: WorldLootSpot | null = null;
  private magazineAmmo = new Map<string, number>();
  private scratchVector = new THREE.Vector3();

  constructor(private canvas: HTMLCanvasElement, private onHudChange: (state: HudState) => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.set(-120, 1.75, 2);
    this.camera.rotation.order = 'YXZ';
    this.setupScene();
    this.loadGame(false);
    new ZombieSpawner(this.scene, this.zombies, this.spawnZones).spawnInitial(this.camera.position);
    this.bindEvents();
    this.emitHud();
    this.loop();
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.canvas.removeEventListener('click', this.onCanvasClick);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mousedown', this.onMouseDown);
  }

  private pressed(code: string) {
    return this.keys[code] === true;
  }

  private setupScene() {
    const world = new WorldBuilder(this.scene, this.loot).build();
    this.lootSpots = world.lootSpots;
    this.spawnZones = world.spawnZones;
    this.atmosphere = new AtmosphereSystem(this.scene, world.ambient, world.sun);
  }

  private bindEvents() {
    this.canvas.addEventListener('click', this.onCanvasClick);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mousedown', this.onMouseDown);
  }

  private onCanvasClick = () => {
    this.sound.unlock();
    this.canvas.requestPointerLock();
  };

  private onResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys[event.code] = true;
    if (event.code === 'Tab') {
      event.preventDefault();
      this.inventoryOpen = !this.inventoryOpen;
      this.sound.play('inventory', 0.15);
      this.raiseNoise(BALANCE.sound.inventoryNoiseRadius, 'Inventar raschelt.');
      this.emitHud();
    }
    if (event.code === 'KeyE') this.interact();
    if (event.code === 'Digit1') this.equipWeaponSlot(0);
    if (event.code === 'Digit2') this.equipWeaponSlot(1);
    if (event.code === 'Digit3') this.equipWeaponSlot(2);
    if (event.code === 'KeyV') this.equipBestArmor();
    if (event.code === 'KeyB') this.equipBestBackpack();
    if (event.code === 'KeyR') this.reloadEquippedWeapon();
    if (event.code === 'KeyF') this.consumeFood();
    if (event.code === 'KeyG') this.consumeDrink();
    if (event.code === 'KeyH') this.useMedical();
    if (event.code === 'F6') this.saveGame(true);
    if (event.code === 'F9') this.loadGame(true);
    if (event.code === BALANCE.loot.debugRespawnKey) this.regenerateLoot(true);
    if (event.code === 'KeyX') this.message = 'Drop-System vorbereitet: Items bleiben aktuell noch im Inventar.';
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys[event.code] = false;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (document.pointerLockElement !== this.canvas) return;
    this.yaw -= event.movementX * 0.002;
    this.pitch -= event.movementY * 0.002;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.35, 1.35);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  };

  private onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0 || document.pointerLockElement !== this.canvas) return;
    this.primaryAttack();
  };

  private loop = () => {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    this.updateMovement(delta);
    updatePlayerVitals(this.stats, delta);
    this.updateReload(delta);
    this.atmosphere.update(delta, this.camera.position);
    this.updateInteractionPrompt();
    this.updateWarnings();
    this.damageFlash = Math.max(0, this.damageFlash - delta * 2.6);

    let alerted = 0;
    for (const zombie of this.zombies) {
      zombie.update(delta, {
        playerPosition: this.camera.position,
        noiseOrigin: this.camera.position,
        noiseRadius: this.noiseRadius,
        isNight: this.atmosphere.isNight(),
        weather: this.atmosphere.weather,
        onAttack: (damage, bleedChance) => this.takeDamage(damage, bleedChance)
      });
      if (zombie.alive && zombie.alerted) alerted += 1;
    }

    this.noiseRadius = Math.max(0, this.noiseRadius - delta * 24);
    if (this.noiseRadius <= 0.2) this.noiseLabel = 'leise';
    this.autoSaveTimer += delta;
    if (this.autoSaveTimer > 20) {
      this.autoSaveTimer = 0;
      this.saveGame(false);
    }

    if (this.stats.hp <= 0) this.message = 'Du bist gestorben. Reload im Browser startet den Prototyp neu.';
    this.emitHud(alerted);
  }

  private updateMovement(delta: number) {
    const forward = (this.pressed('KeyW') ? 1 : 0) - (this.pressed('KeyS') ? 1 : 0);
    const strafe = (this.pressed('KeyD') ? 1 : 0) - (this.pressed('KeyA') ? 1 : 0);
    const moving = forward !== 0 || strafe !== 0;
    const sneaking = this.pressed('ControlLeft') || this.pressed('ControlRight') || this.pressed('KeyC');
    const sprinting = this.pressed('ShiftLeft') && moving && !sneaking && this.stats.stamina > 4;
    const speed = sneaking ? 1.35 : sprinting ? 5.7 : 3.05;

    const direction = this.scratchVector.set(strafe, 0, -forward);
    if (direction.lengthSq() > 0) {
      direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.addScaledVector(direction, speed * delta);
    }

    if (sprinting) this.stats.stamina = Math.max(0, this.stats.stamina - BALANCE.vitals.sprintStaminaPerSecond * delta);
    else this.stats.stamina = Math.min(100, this.stats.stamina + (sneaking ? BALANCE.vitals.sneakStaminaRegenPerSecond : BALANCE.vitals.walkStaminaRegenPerSecond) * delta);

    if (this.pressed('Space') && this.grounded && this.stats.stamina > BALANCE.vitals.jumpStaminaCost) {
      this.verticalVelocity = 5;
      this.grounded = false;
      this.stats.stamina -= BALANCE.vitals.jumpStaminaCost;
      this.raiseNoise(BALANCE.sound.jumpNoiseRadius, 'Sprung landet laut.');
    }

    this.verticalVelocity -= 12 * delta;
    this.camera.position.y += this.verticalVelocity * delta;
    if (this.camera.position.y <= 1.75) {
      this.camera.position.y = 1.75;
      this.verticalVelocity = 0;
      this.grounded = true;
    }
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -BALANCE.world.playerBounds, BALANCE.world.playerBounds);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -BALANCE.world.playerBounds, BALANCE.world.playerBounds);

    if (moving) {
      const radius = sneaking ? BALANCE.sound.sneakNoiseRadius : sprinting ? BALANCE.sound.sprintNoiseRadius : BALANCE.sound.walkNoiseRadius;
      this.raiseNoise(radius);
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this.sound.play(sprinting ? 'sprint' : 'footstep', sprinting ? 0.34 : 0.18);
        this.stepTimer = sprinting ? 0.32 : sneaking ? 0.82 : 0.55;
        if (sprinting) this.message = 'Du sprintest laut. Zombies in der Nähe könnten reagieren.';
      }
    } else {
      this.stepTimer = 0;
    }
  }

  private updateReload(delta: number) {
    this.reloadTimer = Math.max(0, this.reloadTimer - delta);
  }

  private updateWarnings() {
    if (this.stats.hp <= 25) this.warning = 'Kritische Verletzung: HP niedrig.';
    else if (this.stats.bleeding) this.warning = 'Du blutest. Verband oder Blutbeutel benutzen.';
    else if (this.stats.thirst <= 18) this.warning = 'Durst kritisch. Suche Wasser.';
    else if (this.stats.hunger <= 18) this.warning = 'Hunger niedrig. Nahrung wird wichtig.';
    else if (this.atmosphere.isNight()) this.warning = 'Nacht: Sicht schlecht, Bewegung riskanter.';
    else if (this.atmosphere.weather === 'fog') this.warning = 'Nebel reduziert die Sicht stark.';
    else this.warning = '';
  }

  private updateInteractionPrompt() {
    this.hoveredLoot = null;
    this.interactionPrompt = '';
    const visibleLoot = this.lootSpots.filter((spot) => !spot.taken && spot.spawnedLoot && spot.mesh.visible);
    if (visibleLoot.length === 0) return;

    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(visibleLoot.map((spot) => spot.mesh), false);
    const hit = hits.find((candidate) => candidate.distance <= 3.2);
    if (!hit) return;

    const spot = visibleLoot.find((candidate) => candidate.mesh === hit.object) ?? null;
    if (!spot?.spawnedLoot) return;
    const item = ITEMS[spot.spawnedLoot.itemId];
    this.hoveredLoot = spot;
    this.interactionPrompt = `[E] ${item?.name ?? 'Item'} aufnehmen (${spot.definition.label})`;
  }

  private interact() {
    const target = this.hoveredLoot ?? this.findNearestReachableLoot();
    if (!target?.spawnedLoot) {
      this.message = 'Nichts in Interaktionsreichweite. Schau direkt auf Loot und drücke E.';
      return;
    }

    const item = ITEMS[target.spawnedLoot.itemId];
    if (!item) return;
    const amount = target.spawnedLoot.count;
    if (!this.inventory.add(item.id, amount)) {
      this.message = `Inventar voll: Kein Platz für ${item.name}. Rucksack finden oder später Drop-System nutzen.`;
      return;
    }

    target.taken = true;
    target.mesh.visible = false;
    target.respawnAt = performance.now() / 1000 + BALANCE.loot.respawnDelaySeconds;
    target.spawnedLoot = null;
    this.sound.play('pickup', 0.18);
    this.raiseNoise(BALANCE.sound.pickupNoiseRadius);
    this.message = `Aufgenommen: ${item.name}${amount > 1 ? ` x${amount}` : ''}.`;
    this.updateInteractionPrompt();
  }

  private findNearestReachableLoot() {
    return this.lootSpots
      .filter((spot) => !spot.taken && spot.spawnedLoot && spot.mesh.visible && spot.mesh.position.distanceTo(this.camera.position) <= 2.3)
      .sort((a, b) => a.mesh.position.distanceTo(this.camera.position) - b.mesh.position.distanceTo(this.camera.position))[0] ?? null;
  }

  private equipWeaponSlot(index: number) {
    this.inventory.cycleWeapon(index);
    const weapon = this.inventory.equippedWeapon();
    this.message = weapon ? `Ausgerüstet: ${weapon.name}.` : 'Keine Waffe in diesem Slot.';
  }

  private equipBestArmor() {
    this.message = this.inventory.equipBestArmor()
      ? `Rüstung/Kleidung ausgerüstet: ${this.inventory.equippedArmor()?.name}.`
      : 'Keine Rüstung oder Kleidung im Inventar.';
  }

  private equipBestBackpack() {
    this.message = this.inventory.equipBestBackpack()
      ? `Rucksack ausgerüstet: ${this.inventory.equippedBackpack()?.name}.`
      : 'Kein Rucksack im Inventar.';
  }

  private primaryAttack() {
    if (this.stats.hp <= 0) return;
    const weapon = this.inventory.equippedWeapon();
    const weaponData = weapon?.weapon ?? {
      kind: 'melee' as const,
      damage: BALANCE.weapons.fallbackMeleeDamage,
      range: BALANCE.weapons.fallbackMeleeRange,
      noiseRadius: BALANCE.weapons.fallbackMeleeNoiseRadius,
      fireRate: BALANCE.weapons.fallbackMeleeFireRate
    };
    const now = performance.now();
    const cooldownMs = 60000 / weaponData.fireRate;
    if (now - this.lastPrimaryAttack < cooldownMs) return;
    if (this.reloadTimer > 0) {
      this.message = 'Du lädst gerade nach.';
      return;
    }
    this.lastPrimaryAttack = now;

    if (weaponData.kind === 'ranged') {
      if (!weapon) return;
      const loaded = this.magazineAmmo.get(weapon.id) ?? 0;
      if (loaded <= 0) {
        this.message = 'Waffe leer. Drücke R zum Nachladen.';
        return;
      }
      this.magazineAmmo.set(weapon.id, loaded - 1);
      this.sound.play('gunshot', 0.82);
      this.raiseNoise(weaponData.noiseRadius, 'Schuss abgefeuert. Zombies könnten aus großer Entfernung reagieren.');
    } else {
      this.stats.stamina = Math.max(0, this.stats.stamina - BALANCE.vitals.meleeStaminaCost);
      this.raiseNoise(weaponData.noiseRadius);
    }

    const hit = this.findZombieInCrosshair(weaponData.range);
    if (hit) {
      hit.damage(weaponData.damage, this.camera.position);
      this.message = hit.alive ? 'Treffer. Der Zombie bleibt gefährlich.' : 'Zombie ausgeschaltet.';
    } else if (weaponData.kind === 'melee') {
      this.message = 'Du triffst ins Leere.';
    }
  }

  private findZombieInCrosshair(range: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    let best: Zombie | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const zombie of this.zombies) {
      if (!zombie.alive) continue;
      const distance = zombie.mesh.position.distanceTo(this.camera.position);
      if (distance > range) continue;
      const toZombie = zombie.mesh.position.clone().sub(this.camera.position).normalize();
      const facing = this.raycaster.ray.direction.dot(toZombie);
      if (facing > 0.94 && distance < bestDistance) {
        best = zombie;
        bestDistance = distance;
      }
    }
    return best;
  }

  private reloadEquippedWeapon() {
    const weapon = this.inventory.equippedWeapon();
    const data = weapon?.weapon;
    if (!weapon || !data || data.kind !== 'ranged' || !data.ammoType || !data.magazineSize) {
      this.message = 'Diese Waffe muss nicht nachgeladen werden.';
      return;
    }

    const loaded = this.magazineAmmo.get(weapon.id) ?? 0;
    const needed = data.magazineSize - loaded;
    const reserve = this.inventory.count(data.ammoType);
    if (needed <= 0) {
      this.message = 'Magazin ist bereits voll.';
      return;
    }
    if (reserve <= 0) {
      this.message = `Keine passende Munition für ${weapon.name}.`;
      return;
    }

    const amount = Math.min(needed, reserve);
    this.inventory.consumeAmmo(data.ammoType, amount);
    this.magazineAmmo.set(weapon.id, loaded + amount);
    this.reloadTimer = data.reloadTime ?? 1;
    this.sound.play('reload', 0.24);
    this.raiseNoise(BALANCE.sound.reloadNoiseRadius, 'Nachladen macht Geräusche.');
    this.message = `${weapon.name} nachgeladen: ${loaded + amount}/${data.magazineSize}.`;
  }

  private takeDamage(rawDamage: number, bleedChance: number) {
    const result = applyDamage(this.stats, rawDamage, this.inventory.armor, bleedChance);
    this.damageFlash = 1;
    this.sound.play('injury', 0.5);
    this.raiseNoise(BALANCE.sound.painNoiseRadius);
    this.message = result.startedBleeding
      ? `Zombieangriff! ${Math.round(result.damageTaken)} Schaden, du blutest.`
      : `Zombieangriff! ${Math.round(result.damageTaken)} Schaden. Abstand gewinnen.`;
  }

  private consumeFood() {
    const item = this.inventory.useBestFood();
    if (!item) {
      this.message = 'Keine Nahrung im Inventar.';
      return;
    }
    applyItemEffects(this.stats, item);
    this.sound.play('consume', 0.16);
    this.raiseNoise(BALANCE.sound.eatDrinkNoiseRadius);
    this.message = `${item.name} gegessen. Hunger steigt.`;
  }

  private consumeDrink() {
    const item = this.inventory.useBestDrink();
    if (!item) {
      this.message = 'Kein Getränk im Inventar.';
      return;
    }
    applyItemEffects(this.stats, item);
    this.sound.play('consume', 0.16);
    this.raiseNoise(BALANCE.sound.eatDrinkNoiseRadius);
    this.message = `${item.name} getrunken. Durst steigt.`;
  }

  private useMedical() {
    const item = this.inventory.useMedical();
    if (!item) {
      this.message = 'Keine Medizin im Inventar.';
      return;
    }
    applyItemEffects(this.stats, item);
    this.sound.play('consume', 0.14);
    this.message = `${item.name} verwendet.`;
  }

  private raiseNoise(radius: number, message?: string) {
    this.noiseRadius = Math.max(this.noiseRadius, radius);
    this.noiseLabel = radius >= 40 ? 'extrem laut' : radius >= 16 ? 'laut' : radius >= 6 ? 'hörbar' : 'leise';
    if (message) this.message = message;
  }

  private regenerateLoot(debug: boolean) {
    this.lootSpots.forEach((spot) => {
      spot.spawnedLoot = this.loot.spawn(spot.definition);
      spot.taken = false;
      spot.respawnAt = null;
      spot.mesh.visible = Boolean(spot.spawnedLoot);
      const material = spot.mesh.material;
      if (material instanceof THREE.MeshStandardMaterial) material.color.set(this.colorForLoot(spot.spawnedLoot?.itemId));
    });
    if (debug) this.message = 'Debug: Lootspots wurden neu generiert.';
  }

  private colorForLoot(itemId?: string) {
    if (!itemId) return 0x2f332d;
    const item = ITEMS[itemId];
    if (!item) return 0xb7a66f;
    if (item.type === 'food' || item.type === 'drink') return 0xc0aa6d;
    if (item.type === 'medical') return 0xd6d8d4;
    if (item.type === 'ammo' || item.type === 'ranged_weapon') return 0x8a7d5b;
    if (item.type === 'armor' || item.type === 'clothing') return 0x6f7780;
    if (item.type === 'backpack') return 0x6c5b3e;
    return 0x9c8b65;
  }

  private saveGame(manual: boolean) {
    const success = SaveSystem.save({
      player: {
        position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z },
        yaw: this.yaw,
        pitch: this.pitch
      },
      stats: { ...this.stats },
      inventory: this.inventory.toSaveData(),
      magazines: Object.fromEntries(this.magazineAmmo.entries()),
      lootSpots: this.lootSpots.map((spot) => ({
        id: spot.id,
        taken: spot.taken,
        itemId: spot.spawnedLoot?.itemId ?? null,
        count: spot.spawnedLoot?.count ?? 0,
        respawnAt: spot.respawnAt
      })),
      timeOfDay: this.atmosphere.timeOfDay,
      weather: this.atmosphere.weather
    });
    if (manual) this.message = success ? 'Spielstand gespeichert.' : 'Speichern fehlgeschlagen.';
  }

  private loadGame(manual: boolean) {
    const save = SaveSystem.load();
    if (!save) {
      if (manual) this.message = 'Kein Spielstand gefunden.';
      return;
    }

    this.camera.position.set(save.player.position.x, save.player.position.y, save.player.position.z);
    this.yaw = save.player.yaw;
    this.pitch = save.player.pitch;
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.stats = { ...cloneDefaultVitals(), ...save.stats };
    this.inventory.loadSaveData(save.inventory);
    this.magazineAmmo = new Map(Object.entries(save.magazines ?? {}).map(([key, value]) => [key, Number(value)]));
    this.atmosphere.setState(save.timeOfDay, save.weather);
    this.applyLootSave(save.lootSpots ?? []);
    this.message = manual ? 'Spielstand geladen.' : 'Lokaler Spielstand geladen.';
  }

  private applyLootSave(savedSpots: Array<{ id: string; taken: boolean; itemId: string | null; count: number; respawnAt: number | null }>) {
    const savedById = new Map(savedSpots.map((spot) => [spot.id, spot]));
    this.lootSpots.forEach((spot) => {
      const saved = savedById.get(spot.id);
      if (!saved) return;
      spot.taken = saved.taken;
      spot.respawnAt = saved.respawnAt;
      spot.spawnedLoot = saved.itemId ? { itemId: saved.itemId, count: saved.count } : null;
      spot.mesh.visible = Boolean(spot.spawnedLoot) && !spot.taken;
      const material = spot.mesh.material;
      if (material instanceof THREE.MeshStandardMaterial) material.color.set(this.colorForLoot(spot.spawnedLoot?.itemId));
    });
  }

  private emitHud(zombiesAlerted = 0) {
    const weapon = this.inventory.equippedWeapon();
    const weaponData = weapon?.weapon;
    const reserveAmmo = this.inventory.ammoForEquippedWeapon();
    const loadedAmmo = weapon ? this.magazineAmmo.get(weapon.id) ?? 0 : 0;
    const ammoText = weaponData?.kind === 'ranged' ? `${loadedAmmo}/${reserveAmmo}` : 'Nahkampf';

    this.onHudChange({
      hp: Math.round(this.stats.hp),
      stamina: Math.round(this.stats.stamina),
      hunger: Math.round(this.stats.hunger),
      thirst: Math.round(this.stats.thirst),
      bleeding: this.stats.bleeding,
      infection: Math.round(this.stats.infection),
      infected: this.stats.infected,
      capacity: this.inventory.capacity,
      usedSlots: this.inventory.usedSlots,
      armor: this.inventory.armor,
      weapon: weapon?.name ?? 'Fäuste',
      ammo: reserveAmmo,
      ammoText,
      currentBackpack: this.inventory.equippedBackpack()?.name ?? 'Kein Rucksack',
      currentArmor: this.inventory.equippedArmor()?.name ?? 'Keine Rüstung',
      zombiesAlerted,
      interactionPrompt: this.interactionPrompt,
      message: this.message,
      warning: this.warning,
      inventoryOpen: this.inventoryOpen,
      inventory: this.inventory.entries(),
      timeText: this.atmosphere.timeText(),
      weather: this.atmosphere.weather,
      noiseLevel: this.noiseLabel,
      damageFlash: this.damageFlash
    });
  }
}
