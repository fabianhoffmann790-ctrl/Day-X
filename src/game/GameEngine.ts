import * as THREE from 'three';
import { AtmosphereSystem } from './AtmosphereSystem';
import { BALANCE } from './Balance';
import { CraftingSystem } from './CraftingSystem';
import { ITEMS } from './data';
import { FireSystem } from './FireSystem';
import { FirstPersonViewModelSystem } from './FirstPersonViewModelSystem';
import { Inventory, conditionLabel } from './Inventory';
import { ItemWorldSystem } from './ItemWorldSystem';
import { LootSystem } from './LootSystem';
import { PersistentWorldSystem } from './PersistentWorldSystem';
import { applyDamage, applyItemEffects, cloneDefaultVitals, updatePlayerVitals } from './PlayerStats';
import { SaveSystem } from './SaveSystem';
import { SoundSystem } from './SoundSystem';
import { WorldBuilder, type WorldLootSpot } from './WorldBuilder';
import { Zombie } from './Zombie';
import { ZombieSpawner } from './ZombieSpawner';
import type { CraftingRecipeView, HudState, PlayerVitals, SpawnZoneDefinition } from './types';

type KeyMap = Record<string, boolean>;
type WorldActionLike = { label: string; duration: number; noiseRadius: number; complete: () => string };
type InventoryAction = { type: 'use' | 'equip' | 'drop' | 'delete' | 'move_up' | 'move_down' | 'hotbar'; itemId?: string; slot?: number };
interface ActiveAction { label: string; duration: number; elapsed: number; startPosition: THREE.Vector3; onComplete: () => void; }
function craftingIndexFromCode(code: string) { if (code === 'Digit0') return 6; if (!code.startsWith('Digit')) return -1; return Number(code.replace('Digit', '')) - 4; }

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
  private crafting = new CraftingSystem();
  private fires = new FireSystem(this.scene);
  private persistentWorld!: PersistentWorldSystem;
  private itemWorld!: ItemWorldSystem;
  private viewModel!: FirstPersonViewModelSystem;
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
  private craftingOpen = false;
  private stats: PlayerVitals = cloneDefaultVitals();
  private lastPrimaryAttack = 0;
  private reloadTimer = 0;
  private autoSaveTimer = 0;
  private stepTimer = 0;
  private damageFlash = 0;
  private nearbyFireWarmth = 0;
  private activeAction: ActiveAction | null = null;
  private hoveredLoot: WorldLootSpot | null = null;
  private magazineAmmo = new Map<string, number>();
  private scratchVector = new THREE.Vector3();
  private godMode = BALANCE.debug.godModeDefault;
  private debugPanelOpen = BALANCE.debug.panelDefaultOpen;
  private selectedItemId: string | null = null;
  private isMoving = false;
  private isSprinting = false;

  constructor(private canvas: HTMLCanvasElement, private onHudChange: (state: HudState) => void) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.set(BALANCE.debug.respawnPosition.x, BALANCE.debug.respawnPosition.y, BALANCE.debug.respawnPosition.z);
    this.camera.rotation.order = 'YXZ';
    this.setupScene();
    this.loadGame(false);
    new ZombieSpawner(this.scene, this.zombies, this.spawnZones).spawnInitial(this.camera.position);
    this.bindEvents();
    this.updateViewModel();
    this.emitHud();
    this.loop();
  }

  dispose() { cancelAnimationFrame(this.animationId); this.canvas.removeEventListener('click', this.onCanvasClick); window.removeEventListener('resize', this.onResize); window.removeEventListener('keydown', this.onKeyDown); window.removeEventListener('keyup', this.onKeyUp); window.removeEventListener('dayx-inventory-action', this.onInventoryAction as EventListener); document.removeEventListener('mousemove', this.onMouseMove); document.removeEventListener('mousedown', this.onMouseDown); }
  private pressed(code: string) { return this.keys[code] === true; }

  private setupScene() {
    this.scene.add(this.camera);
    const world = new WorldBuilder(this.scene, this.loot).build();
    this.lootSpots = world.lootSpots;
    this.spawnZones = world.spawnZones;
    this.atmosphere = new AtmosphereSystem(this.scene, world.ambient, world.sun);
    this.persistentWorld = new PersistentWorldSystem(this.scene);
    this.itemWorld = new ItemWorldSystem(this.scene);
    this.itemWorld.refreshLootSpots(this.lootSpots);
    this.viewModel = new FirstPersonViewModelSystem(this.camera);
  }

  private bindEvents() { this.canvas.addEventListener('click', this.onCanvasClick); window.addEventListener('resize', this.onResize); window.addEventListener('keydown', this.onKeyDown); window.addEventListener('keyup', this.onKeyUp); window.addEventListener('dayx-inventory-action', this.onInventoryAction as EventListener); document.addEventListener('mousemove', this.onMouseMove); document.addEventListener('mousedown', this.onMouseDown); }
  private onCanvasClick = () => { if (this.inventoryOpen) return; this.sound.unlock(); this.canvas.requestPointerLock(); };
  private onResize = () => { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); };
  private onInventoryAction = (event: Event) => { const detail = (event as CustomEvent<InventoryAction>).detail; if (detail) this.handleInventoryAction(detail); };

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys[event.code] = true;
    if (event.code === BALANCE.debug.respawnKey) this.respawnPlayer();
    if (event.code === BALANCE.debug.godModeKey) this.toggleGodMode();
    if (event.code === BALANCE.debug.debugPanelKey) this.debugPanelOpen = !this.debugPanelOpen;
    if (this.activeAction && event.code !== 'Tab') return;
    if (this.craftingOpen && event.code.startsWith('Digit')) { const recipeIndex = craftingIndexFromCode(event.code); if (recipeIndex >= 0) this.startCraftingByIndex(recipeIndex); return; }
    if (event.code === 'Escape') this.message = this.persistentWorld.closeStorage();
    if (event.code === 'Tab') { event.preventDefault(); this.inventoryOpen = !this.inventoryOpen; if (this.inventoryOpen) document.exitPointerLock(); this.sound.play('inventory', 0.15); this.raiseNoise(BALANCE.sound.inventoryNoiseRadius, 'Inventar raschelt.'); this.emitHud(); }
    if (event.code === 'KeyK') { this.craftingOpen = !this.craftingOpen; this.message = this.craftingOpen ? 'Crafting geöffnet. Nutze 4-0 für sichtbare Rezepte.' : 'Crafting geschlossen.'; }
    if (event.code === 'KeyM') this.message = this.persistentWorld.toggleMap(this.inventory);
    if (event.code === 'KeyN') this.message = this.persistentWorld.cycleBuildable();
    if (event.code === 'KeyP') this.handleWorldResult(this.persistentWorld.beginBuild(this.inventory, this.camera, this.camera.position));
    if (event.code === 'KeyO') this.message = this.persistentWorld.transferFirstToStorage(this.inventory);
    if (event.code === 'KeyI') this.message = this.persistentWorld.transferFirstToInventory(this.inventory);
    if (event.code === 'KeyE') this.interactWorldOrLoot();
    if (event.code.startsWith('Digit')) { const slot = Number(event.code.replace('Digit', '')); if (slot >= 1 && slot <= 5) this.equipHotbar(slot); }
    if (event.code === 'KeyV') this.equipBestArmor();
    if (event.code === 'KeyB') this.equipBestBackpack();
    if (event.code === 'KeyR') this.reloadEquippedWeapon();
    if (event.code === 'KeyF') this.startConsumeFood();
    if (event.code === 'KeyG') this.startConsumeDrink();
    if (event.code === 'KeyH') this.startUseMedical();
    if (event.code === 'KeyT') this.startRepair();
    if (event.code === 'KeyY') this.startPlaceFire();
    if (event.code === 'F6') this.saveGame(true);
    if (event.code === 'F9') this.loadGame(true);
    if (event.code === BALANCE.loot.debugRespawnKey) this.regenerateLoot(true);
    if (event.code === 'KeyX') this.dropSelectedItem();
  };

  private onKeyUp = (event: KeyboardEvent) => { this.keys[event.code] = false; };
  private onMouseMove = (event: MouseEvent) => { if (document.pointerLockElement !== this.canvas) return; this.yaw -= event.movementX * 0.002; this.pitch -= event.movementY * 0.002; this.pitch = THREE.MathUtils.clamp(this.pitch, -1.35, 1.35); this.camera.rotation.set(this.pitch, this.yaw, 0); };
  private onMouseDown = (event: MouseEvent) => { if (event.button !== 0 || document.pointerLockElement !== this.canvas || this.activeAction || this.inventoryOpen) return; this.primaryAttack(); };
  private loop = () => { const delta = Math.min(this.clock.getDelta(), 0.05); this.update(delta); this.renderer.render(this.scene, this.camera); this.animationId = requestAnimationFrame(this.loop); };

  private update(delta: number) {
    this.updateMovement(delta);
    this.fires.update(delta);
    this.nearbyFireWarmth = this.fires.warmthAt(this.camera.position);
    if (!this.godMode) updatePlayerVitals(this.stats, delta, { weather: this.atmosphere.weather, isNight: this.atmosphere.isNight(), warmth: this.inventory.warmth, rainProtection: this.inventory.rainProtection, nearbyFireWarmth: this.nearbyFireWarmth, totalWeight: this.inventory.totalWeight });
    this.updateReload(delta); this.updateAction(delta); this.atmosphere.update(delta, this.camera.position); this.itemWorld.update(this.camera); this.persistentWorld.update(delta, this.camera, this.camera.position, this.noiseRadius, this.atmosphere.isNight(), () => this.takeDamage(BALANCE.zombie.baseDamage, 0.2));
    this.updateInteractionPrompt(); this.updateWarnings(); this.viewModel.update(delta, this.isMoving, this.isSprinting); this.damageFlash = Math.max(0, this.damageFlash - delta * 2.6);
    let alerted = 0; for (const zombie of this.zombies) { zombie.update(delta, { playerPosition: this.camera.position, noiseOrigin: this.camera.position, noiseRadius: this.noiseRadius, isNight: this.atmosphere.isNight(), weather: this.atmosphere.weather, onAttack: (damage, bleedChance) => this.takeDamage(damage, bleedChance) }); if (zombie.alive && zombie.alerted) alerted += 1; }
    this.noiseRadius = Math.max(0, this.noiseRadius - delta * 24); if (this.noiseRadius <= 0.2) this.noiseLabel = 'leise'; this.autoSaveTimer += delta; if (this.autoSaveTimer > 20) { this.autoSaveTimer = 0; this.saveGame(false); }
    if (this.stats.hp <= 0 && !this.godMode) this.message = 'Du bist gestorben. F2 respawnt ohne Neuladen.';
    this.emitHud(alerted);
  }

  private weightPenalty() { const weight = this.inventory.totalWeight; if (weight <= BALANCE.weight.comfortableKg) return { drain: 1, regen: 1, speed: 1 }; if (weight >= BALANCE.weight.heavyKg) return { drain: BALANCE.weight.staminaDrainHeavyMultiplier, regen: BALANCE.weight.staminaRegenHeavyMultiplier, speed: BALANCE.weight.sprintSpeedHeavyMultiplier }; const factor = (weight - BALANCE.weight.comfortableKg) / (BALANCE.weight.heavyKg - BALANCE.weight.comfortableKg); return { drain: 1 + (BALANCE.weight.staminaDrainHeavyMultiplier - 1) * factor, regen: 1 - (1 - BALANCE.weight.staminaRegenHeavyMultiplier) * factor, speed: 1 - (1 - BALANCE.weight.sprintSpeedHeavyMultiplier) * factor }; }
  private updateMovement(delta: number) { if (this.stats.unconscious && !this.godMode) return; const forward = (this.pressed('KeyW') ? 1 : 0) - (this.pressed('KeyS') ? 1 : 0); const strafe = (this.pressed('KeyD') ? 1 : 0) - (this.pressed('KeyA') ? 1 : 0); const moving = forward !== 0 || strafe !== 0; const sneaking = this.pressed('ControlLeft') || this.pressed('ControlRight') || this.pressed('KeyC'); const weight = this.weightPenalty(); const painRegen = 1 - (this.stats.pain / 100) * BALANCE.vitals.painStaminaRegenPenalty; const illnessRegen = this.stats.sick ? 1 - BALANCE.vitals.illnessStaminaPenalty : 1; const fractureSpeed = this.stats.fracture ? BALANCE.vitals.fractureSprintPenalty : 1; const sprinting = this.pressed('ShiftLeft') && moving && !sneaking && this.stats.stamina > 4 && !this.activeAction; this.isMoving = moving; this.isSprinting = sprinting; const speed = sneaking ? 1.35 : sprinting ? 5.7 * weight.speed * fractureSpeed : 3.05 * fractureSpeed; const direction = this.scratchVector.set(strafe, 0, -forward); if (direction.lengthSq() > 0) { direction.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw); this.camera.position.addScaledVector(direction, speed * delta); } if (sprinting && !this.godMode) this.stats.stamina = Math.max(0, this.stats.stamina - BALANCE.vitals.sprintStaminaPerSecond * weight.drain * delta); else this.stats.stamina = Math.min(100, this.stats.stamina + (sneaking ? BALANCE.vitals.sneakStaminaRegenPerSecond : BALANCE.vitals.walkStaminaRegenPerSecond) * weight.regen * painRegen * illnessRegen * delta); if (this.pressed('Space') && this.grounded && this.stats.stamina > BALANCE.vitals.jumpStaminaCost && !this.activeAction) { this.verticalVelocity = 5; this.grounded = false; if (!this.godMode) this.stats.stamina -= BALANCE.vitals.jumpStaminaCost; this.raiseNoise(BALANCE.sound.jumpNoiseRadius, 'Sprung landet laut.'); } this.verticalVelocity -= 12 * delta; this.camera.position.y += this.verticalVelocity * delta; if (this.camera.position.y <= 1.75) { this.camera.position.y = 1.75; this.verticalVelocity = 0; this.grounded = true; } this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -BALANCE.world.playerBounds, BALANCE.world.playerBounds); this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -BALANCE.world.playerBounds, BALANCE.world.playerBounds); if (moving) { const radius = sneaking ? BALANCE.sound.sneakNoiseRadius : sprinting ? BALANCE.sound.sprintNoiseRadius : BALANCE.sound.walkNoiseRadius; this.raiseNoise(radius); this.stepTimer -= delta; if (this.stepTimer <= 0) { this.sound.play(sprinting ? 'sprint' : 'footstep', sprinting ? 0.34 : 0.18); this.stepTimer = sprinting ? 0.32 : sneaking ? 0.82 : 0.55; if (sprinting) this.message = 'Du sprintest laut. Zombies in der Nähe könnten reagieren.'; } } else this.stepTimer = 0; }
  private updateReload(delta: number) { this.reloadTimer = Math.max(0, this.reloadTimer - delta); }
  private updateAction(delta: number) { if (!this.activeAction) return; if (this.activeAction.startPosition.distanceTo(this.camera.position) > 1.25) { this.message = `${this.activeAction.label} abgebrochen: du hast dich bewegt.`; this.activeAction = null; return; } this.activeAction.elapsed += delta; if (this.activeAction.elapsed >= this.activeAction.duration) { const complete = this.activeAction.onComplete; this.activeAction = null; complete(); } }
  private updateWarnings() { if (this.godMode) this.warning = 'DEBUG GOD MODE: Schaden und Survival-Schaden deaktiviert.'; else if (this.stats.unconscious) this.warning = 'Bewusstlosigkeit vorbereitet: kritischer Zustand.'; else if (this.stats.hp <= 25) this.warning = 'Kritische Verletzung: HP niedrig.'; else if (this.stats.bleeding) this.warning = 'Du blutest. Verband oder Blutbeutel benutzen.'; else if (this.stats.infected) this.warning = 'Infektion aktiv. Antibiotika oder Desinfektion suchen.'; else if (this.stats.sick) this.warning = 'Krankheit aktiv. Sauberes Wasser und Medizin werden wichtig.'; else if (this.stats.bodyTemperature < 35.5) this.warning = 'Unterkühlung: trocken bleiben oder Feuer suchen.'; else if (this.stats.wetness > 65) this.warning = 'Du bist nass. Regenjacke oder Feuer hilft.'; else if (this.stats.pain > 45) this.warning = 'Starker Schmerz reduziert deine Ausdauer-Regeneration.'; else if (this.stats.thirst <= 18) this.warning = 'Durst kritisch. Suche Wasser.'; else if (this.stats.hunger <= 18) this.warning = 'Hunger niedrig. Nahrung wird wichtig.'; else if (this.atmosphere.isNight()) this.warning = 'Nacht: Sicht schlecht, Bewegung riskanter.'; else if (this.atmosphere.weather === 'fog') this.warning = 'Nebel reduziert die Sicht stark.'; else this.warning = ''; }
  private updateInteractionPrompt() { this.hoveredLoot = null; this.interactionPrompt = this.itemWorld.prompt(); if (this.interactionPrompt) return; const visibleLoot = this.lootSpots.filter((spot) => !spot.taken && spot.spawnedLoot && spot.mesh.visible); if (visibleLoot.length === 0) return; this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); const hits = this.raycaster.intersectObjects(visibleLoot.map((spot) => spot.mesh), false); const hit = hits.find((candidate) => candidate.distance <= BALANCE.interaction.range); if (!hit) return; const spot = visibleLoot.find((candidate) => candidate.mesh === hit.object) ?? null; if (!spot?.spawnedLoot) return; const item = ITEMS[spot.spawnedLoot.itemId]; this.hoveredLoot = spot; this.interactionPrompt = `[E] Aufheben: ${item?.name ?? 'Item'} (${spot.definition.label})`; }
  private interactWorldOrLoot() { const dropped = this.itemWorld.pickupHovered(this.inventory); if (dropped) { this.message = dropped; this.updateViewModel(); return; } const result = this.persistentWorld.beginInteraction(this.inventory); if (result) { this.handleWorldResult(result); return; } this.interactLoot(); }
  private handleWorldResult(result: WorldActionLike | string | null) { if (!result) return; if (typeof result === 'string') { this.message = result; return; } this.startAction(result.label, result.duration, () => { this.message = result.complete(); this.raiseNoise(result.noiseRadius); }); }
  private interactLoot() { const target = this.hoveredLoot ?? this.findNearestReachableLoot(); if (!target?.spawnedLoot) { this.message = 'Nichts in Interaktionsreichweite. Schau direkt auf Loot, Tür, Container oder Item und drücke E.'; return; } const item = ITEMS[target.spawnedLoot.itemId]; if (!item) return; const amount = target.spawnedLoot.count; if (!this.inventory.add(item.id, amount)) { this.message = `Inventar voll: ${item.name} bleibt liegen.`; return; } target.taken = true; target.mesh.visible = false; target.respawnAt = performance.now() / 1000 + BALANCE.loot.respawnDelaySeconds; target.spawnedLoot = null; this.sound.play('pickup', 0.18); this.raiseNoise(BALANCE.sound.pickupNoiseRadius); this.updateViewModel(); this.message = `Aufgenommen: ${item.name}${amount > 1 ? ` x${amount}` : ''}.`; this.updateInteractionPrompt(); }
  private findNearestReachableLoot() { return this.lootSpots.filter((spot) => !spot.taken && spot.spawnedLoot && spot.mesh.visible && spot.mesh.position.distanceTo(this.camera.position) <= 2.3).sort((a, b) => a.mesh.position.distanceTo(this.camera.position) - b.mesh.position.distanceTo(this.camera.position))[0] ?? null; }

  private handleInventoryAction(action: InventoryAction) { const id = action.itemId; if (action.type === 'hotbar' && action.slot && id) { this.message = this.inventory.assignHotbar(action.slot, id) ? `${ITEMS[id]?.name ?? id} auf Hotbar ${action.slot}.` : 'Hotbar-Zuweisung fehlgeschlagen.'; return; } if (!id) return; this.selectedItemId = id; if (action.type === 'use') this.useSpecificItem(id); if (action.type === 'equip') this.equipSpecificItem(id); if (action.type === 'drop') this.dropItem(id); if (action.type === 'delete') this.deleteItem(id); if (action.type === 'move_up') this.inventory.moveItem(id, -1); if (action.type === 'move_down') this.inventory.moveItem(id, 1); this.updateViewModel(); }
  private equipHotbar(slot: number) { const before = this.inventory.equippedWeaponId; if (this.inventory.equipHotbar(slot)) { this.selectedItemId = this.inventory.hotbar().find((entry) => entry.slot === slot)?.itemId ?? null; this.updateViewModel(); this.message = `Hotbar ${slot}: ${this.selectedItemId ? ITEMS[this.selectedItemId]?.name ?? this.selectedItemId : 'leer'}.`; if (before !== this.inventory.equippedWeaponId) return; } else this.message = `Hotbar ${slot} ist leer oder nicht nutzbar.`; }
  private equipSpecificItem(itemId: string) { this.message = this.inventory.equip(itemId) ? `Ausgerüstet: ${ITEMS[itemId]?.name ?? itemId}.` : 'Item kann nicht ausgerüstet werden.'; this.updateViewModel(); }
  private useSpecificItem(itemId: string) { const item = this.inventory.use(itemId); if (!item) { this.message = 'Item kann nicht benutzt werden.'; return; } applyItemEffects(this.stats, item); this.viewModel.triggerUse(); this.message = `${item.name} benutzt.`; }
  private dropSelectedItem() { const id = this.selectedItemId ?? this.inventory.itemIds()[0]; if (!id) { this.message = 'Kein Item zum Droppen.'; return; } this.dropItem(id); }
  private dropItem(itemId: string) { const item = ITEMS[itemId]; if (!item) return; if (!this.inventory.removeOneForDrop(itemId)) { this.message = 'Drop fehlgeschlagen.'; return; } const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion); this.itemWorld.drop(itemId, 1, this.camera.position, direction); this.selectedItemId = null; this.updateViewModel(); this.message = `Gedroppt: ${item.name}.`; }
  private deleteItem(itemId: string) { const item = ITEMS[itemId]; if (!item) return; this.inventory.remove(itemId, 1); this.selectedItemId = null; this.updateViewModel(); this.message = `Entfernt: ${item.name}.`; }
  private equipBestArmor() { this.message = this.inventory.equipBestArmor() ? `Rüstung/Kleidung ausgerüstet: ${this.inventory.equippedArmor()?.name ?? 'Kleidung'}.` : 'Keine Rüstung oder Kleidung im Inventar.'; }
  private equipBestBackpack() { this.message = this.inventory.equipBestBackpack() ? `Rucksack ausgerüstet: ${this.inventory.equippedBackpack()?.name}.` : 'Kein Rucksack im Inventar.'; }
  private updateViewModel() { this.viewModel?.setItem(this.inventory.equippedWeaponId); }

  private primaryAttack() { if (this.stats.hp <= 0 || this.stats.unconscious) return; const weapon = this.inventory.equippedWeapon(); const weaponData = weapon?.weapon ?? { kind: 'melee' as const, damage: BALANCE.weapons.fallbackMeleeDamage, range: BALANCE.weapons.fallbackMeleeRange, noiseRadius: BALANCE.weapons.fallbackMeleeNoiseRadius, fireRate: BALANCE.weapons.fallbackMeleeFireRate, malfunctionBaseChance: 0 }; const now = performance.now(); const cooldownMs = 60000 / weaponData.fireRate; if (now - this.lastPrimaryAttack < cooldownMs) return; if (this.reloadTimer > 0) { this.message = 'Du lädst gerade nach.'; return; } this.lastPrimaryAttack = now; if (weapon && this.inventory.isRuined(weapon.id)) { this.message = `${weapon.name} ist ruiniert und kann nicht benutzt werden.`; return; } this.viewModel.triggerAttack(weaponData.kind); if (weaponData.kind === 'ranged') { if (!weapon) return; const malfunctionChance = (weaponData.malfunctionBaseChance ?? 0) + ((100 - this.inventory.durabilityOf(weapon.id)) / 100) * BALANCE.weapons.malfunctionConditionMultiplier; if (Math.random() < malfunctionChance) { this.inventory.damageItem(weapon.id, BALANCE.weapons.conditionLossShot * 1.8); this.message = `${weapon.name} hat eine Ladehemmung. Zustand: ${conditionLabel(this.inventory.conditionOf(weapon.id))}.`; this.raiseNoise(3); return; } const loaded = this.magazineAmmo.get(weapon.id) ?? 0; if (loaded <= 0) { this.message = 'Waffe leer. Drücke R zum Nachladen.'; return; } this.magazineAmmo.set(weapon.id, loaded - 1); this.inventory.damageItem(weapon.id, BALANCE.weapons.conditionLossShot); this.sound.play('gunshot', 0.82); this.raiseNoise(weaponData.noiseRadius, 'Schuss abgefeuert. Zombies und Horden könnten reagieren.'); } else { if (weapon) this.inventory.damageItem(weapon.id, BALANCE.weapons.conditionLossMelee); if (!this.godMode) this.stats.stamina = Math.max(0, this.stats.stamina - BALANCE.vitals.meleeStaminaCost); this.raiseNoise(weaponData.noiseRadius); } const hit = this.findZombieInCrosshair(weaponData.range); if (hit) { const conditionMultiplier = weapon ? this.inventory.conditionMultiplier(weapon.id) : 1; hit.damage(weaponData.damage * conditionMultiplier, this.camera.position); this.message = hit.alive ? 'Treffer. Der Zombie bleibt gefährlich.' : 'Zombie ausgeschaltet.'; } else if (weaponData.kind === 'melee') this.message = 'Du triffst ins Leere.'; }
  private findZombieInCrosshair(range: number) { this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera); let best: Zombie | null = null; let bestDistance = Number.POSITIVE_INFINITY; for (const zombie of this.zombies) { if (!zombie.alive) continue; const distance = zombie.mesh.position.distanceTo(this.camera.position); if (distance > range) continue; const toZombie = zombie.mesh.position.clone().sub(this.camera.position).normalize(); const facing = this.raycaster.ray.direction.dot(toZombie); if (facing > 0.94 && distance < bestDistance) { best = zombie; bestDistance = distance; } } return best; }
  private reloadEquippedWeapon() { const weapon = this.inventory.equippedWeapon(); const data = weapon?.weapon; if (!weapon || !data || data.kind !== 'ranged' || !data.ammoType || !data.magazineSize) { this.message = 'Diese Waffe muss nicht nachgeladen werden.'; return; } if (this.inventory.isRuined(weapon.id)) { this.message = `${weapon.name} ist ruiniert.`; return; } const loaded = this.magazineAmmo.get(weapon.id) ?? 0; const needed = data.magazineSize - loaded; const reserve = this.inventory.count(data.ammoType); if (needed <= 0) { this.message = 'Magazin ist bereits voll.'; return; } if (reserve <= 0) { this.message = `Keine passende Munition für ${weapon.name}.`; return; } this.viewModel.triggerReload(); this.startAction('Nachladen', data.reloadTime ?? 1, () => { const amount = Math.min(needed, this.inventory.count(data.ammoType ?? '')); if (!data.ammoType || amount <= 0) { this.message = 'Nachladen fehlgeschlagen: keine Munition mehr.'; return; } this.inventory.consumeAmmo(data.ammoType, amount); this.magazineAmmo.set(weapon.id, loaded + amount); this.sound.play('reload', 0.24); this.raiseNoise(BALANCE.sound.reloadNoiseRadius, 'Nachladen macht Geräusche.'); this.message = `${weapon.name} nachgeladen: ${loaded + amount}/${data.magazineSize}.`; }); }
  private takeDamage(rawDamage: number, bleedChance: number) { if (this.godMode) { this.message = 'God Mode: Angriff erkannt, Schaden blockiert.'; return; } const result = applyDamage(this.stats, rawDamage, this.inventory.armor, bleedChance); this.activeAction = null; this.damageFlash = 1; this.sound.play('injury', 0.5); this.raiseNoise(BALANCE.sound.painNoiseRadius); this.message = result.startedBleeding ? `Zombieangriff! ${Math.round(result.damageTaken)} Schaden, du blutest.` : `Zombieangriff! ${Math.round(result.damageTaken)} Schaden. Abstand gewinnen.`; if (result.infectedByHit) this.message += ' Infektionsrisiko!'; }
  private startConsumeFood() { const item = this.inventory.entries().find((entry) => entry.type === 'food' && entry.canUse); if (!item) { this.message = 'Keine Nahrung im Inventar.'; return; } this.startAction(`Essen: ${item.name}`, 2.6, () => { const consumed = this.inventory.useBestFood(); if (!consumed) return; applyItemEffects(this.stats, consumed); this.viewModel.triggerUse(); this.sound.play('consume', 0.16); this.raiseNoise(BALANCE.sound.eatDrinkNoiseRadius); this.message = `${consumed.name} gegessen.`; }); }
  private startConsumeDrink() { const item = this.inventory.entries().find((entry) => entry.type === 'drink' && entry.canUse); if (!item) { this.message = 'Kein Getränk im Inventar.'; return; } this.startAction(`Trinken: ${item.name}`, 2.2, () => { const consumed = this.inventory.useBestDrink(); if (!consumed) return; applyItemEffects(this.stats, consumed); this.viewModel.triggerUse(); this.sound.play('consume', 0.16); this.raiseNoise(BALANCE.sound.eatDrinkNoiseRadius); this.message = `${consumed.name} getrunken.`; }); }
  private startUseMedical() { const item = this.inventory.entries().find((entry) => entry.type === 'medical' && entry.canUse); if (!item) { this.message = 'Keine Medizin im Inventar.'; return; } this.startAction(`Medizin: ${item.name}`, item.id.includes('bandage') ? 4.6 : 3.2, () => { const consumed = this.inventory.useMedical(); if (!consumed) return; applyItemEffects(this.stats, consumed); this.viewModel.triggerUse(); this.sound.play('consume', 0.14); this.message = `${consumed.name} verwendet.`; }); }
  private startRepair() { this.startAction('Reparieren', BALANCE.crafting.repairTimeSeconds, () => { const result = this.inventory.repairBestEquipped(); this.message = result.message; if (result.ok) this.sound.play('pickup', 0.12); }); }
  private startPlaceFire() { if (!this.inventory.has('campfire_kit')) { this.message = 'Du brauchst ein Lagerfeuer-Set. Öffne Crafting mit K.'; return; } if (!this.inventory.hasAny(['matches', 'lighter'])) { this.message = 'Du brauchst Streichhölzer oder ein Feuerzeug.'; return; } this.startAction('Lagerfeuer anzünden', BALANCE.crafting.campfireTimeSeconds, () => { if (!this.inventory.consumeForCrafting('campfire_kit', 1)) return; if (this.inventory.has('matches')) this.inventory.consumeForCrafting('matches', 1); const offset = new THREE.Vector3(0, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw); this.fires.place(this.camera.position.clone().add(offset)); this.raiseNoise(BALANCE.fire.noiseRadius, 'Lagerfeuer brennt. Wärme und Licht können dich retten, aber auch auffallen.'); }); }
  private startCraftingByIndex(index: number) { const views = this.crafting.view(this.inventory); const view = views[index]; if (!view) return; const recipe = this.crafting.recipeById(view.id); if (!recipe) return; if (!view.available) { this.message = `Rezept nicht verfügbar. Fehlt: ${view.missing.join(', ')}`; return; } this.startAction(`Crafting: ${recipe.name}`, recipe.timeSeconds, () => { const ok = this.crafting.craft(this.inventory, recipe); this.message = ok ? `Gecraftet: ${ITEMS[recipe.result.itemId].name}.` : 'Crafting fehlgeschlagen.'; }); }
  private startAction(label: string, duration: number, onComplete: () => void) { if (this.activeAction) return; this.activeAction = { label, duration, elapsed: 0, startPosition: this.camera.position.clone(), onComplete }; this.message = `${label} läuft... Bewegung oder Treffer brechen ab.`; }
  private raiseNoise(radius: number, message?: string) { this.noiseRadius = Math.max(this.noiseRadius, radius); this.noiseLabel = radius >= 40 ? 'extrem laut' : radius >= 16 ? 'laut' : radius >= 6 ? 'hörbar' : 'leise'; this.persistentWorld?.setNoiseAtPlayer(this.camera.position, radius); if (message) this.message = message; }
  private regenerateLoot(debug: boolean) { this.lootSpots.forEach((spot) => { spot.spawnedLoot = this.loot.spawn(spot.definition); spot.taken = false; spot.respawnAt = null; spot.mesh.visible = Boolean(spot.spawnedLoot); const material = spot.mesh.material; if (material instanceof THREE.MeshStandardMaterial) material.color.set(this.colorForLoot(spot.spawnedLoot?.itemId)); }); this.itemWorld.refreshLootSpots(this.lootSpots); if (debug) this.message = 'Debug: Lootspots wurden neu generiert.'; }
  private colorForLoot(itemId?: string) { if (!itemId) return 0x2f332d; const item = ITEMS[itemId]; if (!item) return 0xb7a66f; if (item.type === 'food' || item.type === 'drink') return 0xc0aa6d; if (item.type === 'medical') return 0xd6d8d4; if (item.type === 'ammo' || item.type === 'ranged_weapon') return 0x8a7d5b; if (item.type === 'armor' || item.type === 'clothing') return 0x6f7780; if (item.type === 'backpack') return 0x6c5b3e; return 0x9c8b65; }
  private respawnPlayer() { this.camera.position.set(BALANCE.debug.respawnPosition.x, BALANCE.debug.respawnPosition.y, BALANCE.debug.respawnPosition.z); this.yaw = 0; this.pitch = 0; this.camera.rotation.set(0, 0, 0); this.verticalVelocity = 0; this.grounded = true; this.activeAction = null; this.stats = { ...cloneDefaultVitals(), hunger: BALANCE.debug.respawnHunger, thirst: BALANCE.debug.respawnThirst }; this.message = 'Debug-Respawn ausgeführt. Kamera und Status wurden zurückgesetzt.'; }
  private toggleGodMode() { this.godMode = !this.godMode; this.message = this.godMode ? 'God Mode aktiviert.' : 'God Mode deaktiviert.'; }

  private saveGame(manual: boolean) { const success = SaveSystem.save({ player: { position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z }, yaw: this.yaw, pitch: this.pitch }, stats: { ...this.stats }, inventory: this.inventory.toSaveData(), magazines: Object.fromEntries(this.magazineAmmo.entries()), lootSpots: this.lootSpots.map((spot) => ({ id: spot.id, taken: spot.taken, itemId: spot.spawnedLoot?.itemId ?? null, count: spot.spawnedLoot?.count ?? 0, respawnAt: spot.respawnAt })), timeOfDay: this.atmosphere.timeOfDay, weather: this.atmosphere.weather, campfires: this.fires.toSaveData(), persistentWorld: this.persistentWorld.toSaveData(), droppedItems: this.itemWorld.toSaveData(), selectedItemId: this.selectedItemId, respawnPoint: BALANCE.debug.respawnPosition }); if (manual) this.message = success ? 'Spielstand gespeichert.' : 'Speichern fehlgeschlagen.'; }
  private loadGame(manual: boolean) { const save = SaveSystem.load(); if (!save) { if (manual) this.message = 'Kein Spielstand gefunden.'; return; } this.camera.position.set(save.player.position.x, save.player.position.y, save.player.position.z); this.yaw = save.player.yaw; this.pitch = save.player.pitch; this.camera.rotation.set(this.pitch, this.yaw, 0); this.stats = { ...cloneDefaultVitals(), ...save.stats }; this.inventory.loadSaveData(save.inventory); this.magazineAmmo = new Map(Object.entries(save.magazines ?? {}).map(([key, value]) => [key, Number(value)])); this.atmosphere.setState(save.timeOfDay, save.weather); this.fires.loadSaveData(save.campfires ?? []); this.persistentWorld.loadSaveData(save.persistentWorld); this.itemWorld.loadSaveData(save.droppedItems ?? []); this.selectedItemId = save.selectedItemId ?? null; this.applyLootSave(save.lootSpots ?? []); this.updateViewModel(); this.message = manual ? 'Spielstand geladen.' : 'Lokaler Spielstand geladen.'; }
  private applyLootSave(savedSpots: Array<{ id: string; taken: boolean; itemId: string | null; count: number; respawnAt: number | null }>) { const savedById = new Map(savedSpots.map((spot) => [spot.id, spot])); this.lootSpots.forEach((spot) => { const saved = savedById.get(spot.id); if (!saved) return; spot.taken = saved.taken; spot.respawnAt = saved.respawnAt; spot.spawnedLoot = saved.itemId ? { itemId: saved.itemId, count: saved.count } : null; spot.mesh.visible = Boolean(spot.spawnedLoot) && !spot.taken; const material = spot.mesh.material; if (material instanceof THREE.MeshStandardMaterial) material.color.set(this.colorForLoot(spot.spawnedLoot?.itemId)); }); this.itemWorld.refreshLootSpots(this.lootSpots); }
  private craftingViews(): CraftingRecipeView[] { return this.crafting.view(this.inventory).slice(0, 7); }

  private emitHud(zombiesAlerted = 0) { const weapon = this.inventory.equippedWeapon(); const weaponData = weapon?.weapon; const reserveAmmo = this.inventory.ammoForEquippedWeapon(); const loadedAmmo = weapon ? this.magazineAmmo.get(weapon.id) ?? 0 : 0; const ammoText = weaponData?.kind === 'ranged' ? `${loadedAmmo}/${reserveAmmo}` : 'Nahkampf'; const weaponCondition = weapon ? conditionLabel(this.inventory.conditionOf(weapon.id)) : '-'; const worldHud = this.persistentWorld.hud(this.camera, this.camera.position); this.onHudChange({ hp: Math.round(this.stats.hp), stamina: Math.round(this.stats.stamina), hunger: Math.round(this.stats.hunger), thirst: Math.round(this.stats.thirst), bleeding: this.stats.bleeding, infection: Math.round(this.stats.infection), infected: this.stats.infected, bodyTemperature: Math.round(this.stats.bodyTemperature * 10) / 10, wetness: Math.round(this.stats.wetness), cold: Math.round(this.stats.cold), illness: Math.round(this.stats.illness), sick: this.stats.sick, pain: Math.round(this.stats.pain), unconscious: this.stats.unconscious, fracture: this.stats.fracture, capacity: this.inventory.capacity, usedSlots: this.inventory.usedSlots, totalWeight: this.inventory.totalWeight, armor: this.inventory.armor, warmth: this.inventory.warmth, rainProtection: this.inventory.rainProtection, weapon: weapon?.name ?? 'Fäuste', weaponCondition, ammo: reserveAmmo, ammoText, currentBackpack: this.inventory.equippedBackpack()?.name ?? 'Kein Rucksack', currentArmor: this.inventory.equippedArmor()?.name ?? 'Keine Rüstung', clothing: this.inventory.clothingSummary(), zombiesAlerted, interactionPrompt: this.interactionPrompt, message: this.message, warning: this.warning, inventoryOpen: this.inventoryOpen, craftingOpen: this.craftingOpen, craftingRecipes: this.craftingViews(), inventory: this.inventory.entries(), selectedItemId: this.selectedItemId, hotbar: this.inventory.hotbar(), debug: { godMode: this.godMode, debugPanelOpen: this.debugPanelOpen, playerPosition: `${this.camera.position.x.toFixed(1)}, ${this.camera.position.y.toFixed(1)}, ${this.camera.position.z.toFixed(1)}`, zombieCount: this.zombies.filter((zombie) => zombie.alive).length, lootSpotCount: this.lootSpots.filter((spot) => !spot.taken && spot.spawnedLoot).length, droppedItemCount: this.itemWorld.count() }, timeText: this.atmosphere.timeText(), weather: this.atmosphere.weather, noiseLevel: this.noiseLabel, actionLabel: this.activeAction?.label ?? '', actionProgress: this.activeAction ? Math.min(1, this.activeAction.elapsed / this.activeAction.duration) : 0, nearbyFireWarmth: Math.round(this.nearbyFireWarmth * 100), damageFlash: this.damageFlash, worldPrompt: worldHud.prompt, locationName: worldHud.locationName, eventHint: worldHud.eventHint, compassHeading: worldHud.compassHeading, mapOpen: worldHud.mapOpen, buildMode: worldHud.buildMode, selectedBuildable: worldHud.selectedBuildable, storageOpen: worldHud.storageOpen, storageTitle: worldHud.storageTitle, storageUsed: worldHud.storageUsed, storageCapacity: worldHud.storageCapacity, storageItems: worldHud.storageItems }); }
}
