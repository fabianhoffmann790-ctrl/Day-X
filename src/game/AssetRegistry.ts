import { ITEMS } from './data';
import type { ItemType } from './types';

export type ItemModelKind =
  | 'can' | 'fruit' | 'bar' | 'bottle' | 'soda_can' | 'canteen'
  | 'bandage_roll' | 'rag_bundle' | 'med_box' | 'pill_pack' | 'fluid_bottle' | 'blood_bag'
  | 'pistol' | 'rifle' | 'knife' | 'hatchet' | 'crowbar' | 'spear'
  | 'ammo_stack' | 'backpack_small' | 'backpack_medium' | 'backpack_large'
  | 'vest' | 'helmet' | 'clothing_pack' | 'boots'
  | 'hammer' | 'wrench' | 'saw' | 'duct_tape' | 'toolbox' | 'nails' | 'rope' | 'firewood' | 'metal_parts' | 'key' | 'map' | 'radio' | 'torch' | 'campfire_kit'
  | 'generic_item';

export interface ItemAssetDefinition {
  itemId: string;
  category: ItemType;
  modelKind: ItemModelKind;
  iconLabel: string;
  iconFg: string;
  iconBg: string;
  scale: number;
  groundOffsetY: number;
  viewModel?: { scale: number; position: [number, number, number]; rotation: [number, number, number] };
}

const palette: Record<ItemType, { fg: string; bg: string; label: string; model: ItemModelKind }> = {
  food: { fg: '#f0d08a', bg: '#4a3422', label: 'FO', model: 'can' },
  drink: { fg: '#bfe8ff', bg: '#20394a', label: 'DR', model: 'bottle' },
  medical: { fg: '#ffe8e8', bg: '#5b2222', label: 'MED', model: 'med_box' },
  ammo: { fg: '#f0d88c', bg: '#514829', label: 'AM', model: 'ammo_stack' },
  melee_weapon: { fg: '#dedbd2', bg: '#34322e', label: 'MW', model: 'crowbar' },
  ranged_weapon: { fg: '#d6e2df', bg: '#1d2022', label: 'RW', model: 'pistol' },
  armor: { fg: '#d6e2ff', bg: '#28313b', label: 'AR', model: 'vest' },
  clothing: { fg: '#d6ead2', bg: '#2d382f', label: 'CL', model: 'clothing_pack' },
  backpack: { fg: '#f1d19a', bg: '#3d2d1c', label: 'BP', model: 'backpack_medium' },
  tool: { fg: '#f0d88c', bg: '#463d2a', label: 'TL', model: 'generic_item' }
};

const modelOverrides: Record<string, [ItemModelKind, string]> = {
  canned_food: ['can', 'CAN'], beans: ['can', 'BEAN'], crackers: ['bar', 'CRK'], energy_bar: ['bar', 'BAR'], apple: ['fruit', 'APL'], rotten_food: ['fruit', 'BAD'],
  water_bottle: ['bottle', 'H2O'], dirty_water: ['bottle', 'DIRT'], clean_water: ['bottle', 'H2O'], canteen: ['canteen', 'FL'], soda: ['soda_can', 'SODA'], sports_drink: ['bottle', 'ISO'],
  bandage: ['bandage_roll', 'BND'], rag: ['rag_bundle', 'RAG'], improvised_bandage: ['rag_bundle', 'IBND'], disinfectant: ['fluid_bottle', 'DIS'], painkillers: ['pill_pack', 'PAIN'], antibiotics: ['pill_pack', 'AB'], blood_bag: ['blood_bag', 'BLD'], saline: ['fluid_bottle', 'SAL'],
  pistol: ['pistol', 'PST'], rifle: ['rifle', 'RFL'], kitchen_knife: ['knife', 'KNF'], hatchet: ['hatchet', 'AXE'], crowbar: ['crowbar', 'BAR'], wooden_spear: ['spear', 'SPR'], ammo_9mm: ['ammo_stack', '9MM'], ammo_556: ['ammo_stack', '556'],
  tshirt: ['clothing_pack', 'TEE'], hoodie: ['clothing_pack', 'HOD'], work_jacket: ['clothing_pack', 'JKT'], rain_jacket: ['clothing_pack', 'RAIN'], work_pants: ['clothing_pack', 'PNT'], military_pants: ['clothing_pack', 'MPNT'], boots: ['boots', 'BOOT'], gloves: ['clothing_pack', 'GLV'],
  motorcycle_helmet: ['helmet', 'HELM'], military_helmet: ['helmet', 'MHL'], tactical_vest: ['vest', 'VST'], plate_carrier: ['vest', 'PLT'], small_backpack: ['backpack_small', 'SBP'], hiking_backpack: ['backpack_medium', 'HBP'], field_pack: ['backpack_large', 'FBP'], improvised_backpack: ['backpack_small', 'IBP'],
  radio: ['radio', 'RAD'], map: ['map', 'MAP'], compass: ['map', 'CMP'], simple_key: ['key', 'KEY'], police_key: ['key', 'PKEY'], clinic_key: ['key', 'CKEY'], military_keycard: ['key', 'CARD'], lockpick: ['key', 'PICK'],
  nails: ['nails', 'NAIL'], hammer: ['hammer', 'HAM'], saw: ['saw', 'SAW'], metal_parts: ['metal_parts', 'MET'], duct_tape: ['duct_tape', 'TAPE'], sewing_kit: ['med_box', 'SEW'], toolbox: ['toolbox', 'TOOLS'], weapon_cleaning_kit: ['med_box', 'CLEAN'], wrench: ['wrench', 'WRN'], scrap_parts: ['metal_parts', 'SCR'], stick: ['firewood', 'STK'], firewood: ['firewood', 'WOOD'], matches: ['key', 'MTCH'], lighter: ['key', 'LITE'], burlap_sack: ['rag_bundle', 'SACK'], rope: ['rope', 'ROPE'], torch: ['torch', 'TRCH'], campfire_kit: ['campfire_kit', 'FIRE'], note_hospital: ['map', 'NOTE'], note_convoy: ['map', 'NOTE']
};

const viewModels: Record<string, ItemAssetDefinition['viewModel']> = {
  pistol: { scale: 1.24, position: [0.02, -0.02, -0.02], rotation: [0.08, 0.12, 0] },
  rifle: { scale: 1.1, position: [-0.08, -0.02, -0.12], rotation: [0.06, 0.18, 0] },
  kitchen_knife: { scale: 1.25, position: [0.02, -0.02, 0.02], rotation: [0.35, 0.75, -0.55] },
  hatchet: { scale: 1.15, position: [0.05, -0.04, 0.02], rotation: [0.25, 0.75, -0.72] },
  crowbar: { scale: 1.18, position: [0.05, -0.02, 0.02], rotation: [0.4, 0.7, -0.55] },
  wooden_spear: { scale: 1.15, position: [0.04, -0.06, -0.12], rotation: [0.3, 0.6, -0.42] }
};

export class AssetRegistry {
  static item(itemId: string): ItemAssetDefinition {
    const item = ITEMS[itemId];
    const base = palette[item?.type ?? 'tool'];
    const override = modelOverrides[itemId];
    return { itemId, category: item?.type ?? 'tool', modelKind: override?.[0] ?? base.model, iconLabel: override?.[1] ?? base.label, iconFg: base.fg, iconBg: base.bg, scale: 1, groundOffsetY: 0.02, viewModel: viewModels[itemId] };
  }

  static iconDataUri(itemId: string) {
    const def = this.item(itemId);
    const label = encodeURIComponent(def.iconLabel.slice(0, 5));
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='10' fill='${def.iconBg}'/><path d='M12 48h40M16 18h32M18 14h28v36H18z' fill='none' stroke='${def.iconFg}' stroke-width='3' stroke-linecap='round' opacity='.45'/><circle cx='49' cy='15' r='5' fill='${def.iconFg}' opacity='.85'/><text x='32' y='39' fill='${def.iconFg}' font-family='Arial' font-size='14' font-weight='800' text-anchor='middle'>${label}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  static validate() {
    const missingIcons: string[] = [];
    const genericModels: string[] = [];
    for (const item of Object.values(ITEMS)) {
      const asset = this.item(item.id);
      if (!asset.iconLabel) missingIcons.push(item.id);
      if (asset.modelKind === 'generic_item') genericModels.push(item.id);
    }
    return { ok: missingIcons.length === 0, missingIcons, genericModels };
  }
}
