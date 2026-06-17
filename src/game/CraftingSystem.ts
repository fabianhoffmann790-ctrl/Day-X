import { BALANCE } from './Balance';
import { ITEMS } from './data';
import type { CraftingRecipeView } from './types';
import { Inventory } from './Inventory';

interface Ingredient {
  itemId: string;
  count: number;
  consume?: boolean;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  timeSeconds: number;
  ingredients: Ingredient[];
  result: { itemId: string; count: number };
}

function ingredientOptions(itemId: string) { return itemId.split('|'); }
function ingredientLabel(ingredient: Ingredient) { return ingredientOptions(ingredient.itemId).map((id) => ITEMS[id]?.name ?? id).join(' oder ') + ` x${ingredient.count}`; }

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { id: 'rags_from_tshirt', name: 'Lumpen aus T-Shirt', description: 'Zerschneidet ein T-Shirt in brauchbare Lumpen.', timeSeconds: BALANCE.crafting.ragTimeSeconds, ingredients: [{ itemId: 'tshirt', count: 1 }], result: { itemId: 'rag', count: 3 } },
  { id: 'improvised_bandage', name: 'Improvisierter Verband', description: 'Lumpenverband. Stoppt Blutung, aber Infektionsrisiko bleibt.', timeSeconds: BALANCE.crafting.bandageTimeSeconds, ingredients: [{ itemId: 'rag', count: 2 }], result: { itemId: 'improvised_bandage', count: 1 } },
  { id: 'torch', name: 'Einfache Fackel', description: 'Vorbereitete Lichtquelle aus Stock und Lumpen.', timeSeconds: BALANCE.crafting.torchTimeSeconds, ingredients: [{ itemId: 'stick', count: 1 }, { itemId: 'rag', count: 1 }], result: { itemId: 'torch', count: 1 } },
  { id: 'campfire_kit', name: 'Lagerfeuer-Set', description: 'Bündelt Feuerholz und Zunder zu einer platzierbaren Feuerstelle.', timeSeconds: BALANCE.crafting.campfireTimeSeconds, ingredients: [{ itemId: 'firewood', count: 2 }, { itemId: 'rag', count: 1 }, { itemId: 'matches|lighter', count: 1, consume: false }], result: { itemId: 'campfire_kit', count: 1 } },
  { id: 'improvised_backpack', name: 'Improvisierter Rucksack', description: 'Notfallrucksack aus Jutesack und Seil.', timeSeconds: BALANCE.crafting.backpackTimeSeconds, ingredients: [{ itemId: 'burlap_sack', count: 1 }, { itemId: 'rope', count: 1 }], result: { itemId: 'improvised_backpack', count: 1 } },
  { id: 'wooden_spear', name: 'Holzspeer', description: 'Stock wird mit Messer zu einer riskanten Distanzwaffe.', timeSeconds: BALANCE.crafting.spearTimeSeconds, ingredients: [{ itemId: 'stick', count: 1 }, { itemId: 'kitchen_knife', count: 1, consume: false }], result: { itemId: 'wooden_spear', count: 1 } },
  { id: 'clean_water_prepared', name: 'Wasser abkochen vorbereiten', description: 'Bereitet sauberes Wasser vor. Feuer/Kochen wird später genauer simuliert.', timeSeconds: BALANCE.crafting.boilWaterPreparedTimeSeconds, ingredients: [{ itemId: 'dirty_water', count: 1 }, { itemId: 'matches|lighter', count: 1, consume: false }], result: { itemId: 'clean_water', count: 1 } }
];

export class CraftingSystem {
  recipes() { return CRAFTING_RECIPES; }

  view(inventory: Inventory): CraftingRecipeView[] {
    return CRAFTING_RECIPES.map((recipe) => {
      const missing = recipe.ingredients.filter((ingredient) => !this.hasIngredient(inventory, ingredient)).map(ingredientLabel);
      return { id: recipe.id, name: recipe.name, available: missing.length === 0, timeSeconds: recipe.timeSeconds, missing };
    });
  }

  recipeById(id: string) { return CRAFTING_RECIPES.find((recipe) => recipe.id === id) ?? null; }
  canCraft(inventory: Inventory, recipe: CraftingRecipe) { return recipe.ingredients.every((ingredient) => this.hasIngredient(inventory, ingredient)); }

  craft(inventory: Inventory, recipe: CraftingRecipe) {
    if (!this.canCraft(inventory, recipe)) return false;
    for (const ingredient of recipe.ingredients) {
      if (ingredient.consume === false) continue;
      const used = ingredientOptions(ingredient.itemId).find((itemId) => inventory.has(itemId, ingredient.count));
      if (used) inventory.consumeForCrafting(used, ingredient.count);
    }
    return inventory.add(recipe.result.itemId, recipe.result.count);
  }

  private hasIngredient(inventory: Inventory, ingredient: Ingredient) {
    return ingredientOptions(ingredient.itemId).some((itemId) => inventory.has(itemId, ingredient.count));
  }
}
