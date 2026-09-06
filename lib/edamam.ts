import type { Ingredient, MealDetail, MealSummary, NutritionInfo } from '@/types/meal';

const BASE_URL = 'https://api.edamam.com/api/recipes/v2';
const EDAMAM_PREFIX = 'ed-';

/**
 * Cuisines que reconoce Edamam (Recipe Search API v2). Se suma como tercera
 * fuente de países junto a TheMealDB y Spoonacular: Edamam ya trae nutrición
 * calculada por receta, así que además de sumar cobertura de países resuelve
 * "gratis" la nutrición para esas recetas.
 */
export const EDAMAM_CUISINES = [
  'American',
  'Asian',
  'British',
  'Caribbean',
  'Central Europe',
  'Chinese',
  'Eastern Europe',
  'French',
  'Indian',
  'Italian',
  'Japanese',
  'Kosher',
  'Mediterranean',
  'Mexican',
  'Middle Eastern',
  'Nordic',
  'South American',
  'South East Asian',
];

export function isEdamamCuisine(value: string): boolean {
  return EDAMAM_CUISINES.some((c) => c.toLowerCase() === value.toLowerCase());
}

export function isEdamamId(id: string): boolean {
  return id.startsWith(EDAMAM_PREFIX);
}

export function stripEdamamPrefix(id: string): string {
  return id.slice(EDAMAM_PREFIX.length);
}

interface EdamamNutrient {
  quantity: number;
  unit: string;
}

interface EdamamRecipe {
  uri: string;
  label: string;
  image?: string;
  url?: string;
  cuisineType?: string[];
  mealType?: string[];
  ingredientLines?: string[];
  totalNutrients?: {
    ENERC_KCAL?: EdamamNutrient;
    CHOCDF?: EdamamNutrient;
    FAT?: EdamamNutrient;
    PROCNT?: EdamamNutrient;
    NA?: EdamamNutrient;
  };
}

/** El "id" de Edamam es el hash final de su uri: .../recipe_<hash>. */
function extractId(uri: string): string {
  const marker = '#recipe_';
  const index = uri.indexOf(marker);
  return index === -1 ? uri : uri.slice(index + marker.length);
}

function formatNutrient(nutrient: EdamamNutrient | undefined): string {
  if (!nutrient) return '—';
  return `${Math.round(nutrient.quantity)} ${nutrient.unit}`;
}

function toNutritionInfo(
  nutrients: EdamamRecipe['totalNutrients']
): NutritionInfo | undefined {
  if (!nutrients) return undefined;

  return {
    calories: formatNutrient(nutrients.ENERC_KCAL),
    carbs: formatNutrient(nutrients.CHOCDF),
    fat: formatNutrient(nutrients.FAT),
    protein: formatNutrient(nutrients.PROCNT),
    sodium: formatNutrient(nutrients.NA),
  };
}

function toSummary(recipe: EdamamRecipe): MealSummary {
  return {
    id: `${EDAMAM_PREFIX}${extractId(recipe.uri)}`,
    name: recipe.label,
    thumbnail: recipe.image ?? null,
    category: recipe.mealType?.[0],
    area: recipe.cuisineType?.[0],
  };
}

function toDetail(recipe: EdamamRecipe): MealDetail {
  const ingredients: Ingredient[] = (recipe.ingredientLines ?? []).map((line) => ({
    name: line,
    measure: '',
  }));

  return {
    ...toSummary(recipe),
    // Edamam no entrega pasos de preparación propios, solo enlaza a la fuente.
    instructions: null,
    tags: recipe.mealType ?? [],
    youtubeUrl: null,
    sourceUrl: recipe.url ?? null,
    ingredients,
    nutrition: toNutritionInfo(recipe.totalNutrients),
  };
}

function credentials(): { appId: string; appKey: string } {
  const appId = process.env.EDAMAM_APP_ID;
  const appKey = process.env.EDAMAM_APP_KEY;
  if (!appId || !appKey) {
    throw new Error('Faltan configurar EDAMAM_APP_ID / EDAMAM_APP_KEY');
  }
  return { appId, appKey };
}

/**
 * Búsqueda por cuisine/país. Solo se llama desde el servidor (la ruta
 * /api/edamam-cuisine), así la app_key nunca viaja al navegador.
 */
export async function searchEdamamByCuisine(cuisine: string): Promise<MealSummary[]> {
  const { appId, appKey } = credentials();
  const res = await fetch(
    `${BASE_URL}?type=public&cuisineType=${encodeURIComponent(
      cuisine
    )}&app_id=${appId}&app_key=${appKey}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error(`Edamam respondió ${res.status} para cuisineType=${cuisine}`);
  }

  const data = (await res.json()) as { hits: { recipe: EdamamRecipe }[] };
  return data.hits.map((hit) => toSummary(hit.recipe));
}

/**
 * Detalle por id. Llamado desde un Server Component (página de detalle), así
 * que las credenciales nunca llegan al cliente.
 */
export async function getEdamamMealById(id: string): Promise<MealDetail | null> {
  const { appId, appKey } = credentials();
  const res = await fetch(
    `${BASE_URL}/${encodeURIComponent(id)}?type=public&app_id=${appId}&app_key=${appKey}`,
    { next: { revalidate: 3600 } }
  );

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Edamam respondió ${res.status} para la receta ${id}`);
  }

  const data = (await res.json()) as { recipe: EdamamRecipe };
  return toDetail(data.recipe);
}

/**
 * Llamada desde el navegador (ej. la página de favoritos) a nuestra propia
 * ruta /api/edamam-recipe/[id], que es la que esconde la app_key.
 */
export async function fetchEdamamMealSummary(id: string): Promise<MealSummary | null> {
  const res = await fetch(`/api/edamam-recipe/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`La consulta a Edamam respondió ${res.status}`);
  }
  const meal = (await res.json()) as MealDetail;
  return {
    id: meal.id,
    name: meal.name,
    thumbnail: meal.thumbnail,
    category: meal.category,
    area: meal.area,
  };
}

/**
 * Llamada desde el navegador (componente cliente) a nuestra propia ruta
 * /api/edamam-cuisine, que es la que realmente habla con Edamam.
 */
export async function filterByEdamamCuisine(cuisine: string): Promise<MealSummary[]> {
  const res = await fetch(`/api/edamam-cuisine?cuisine=${encodeURIComponent(cuisine)}`);
  if (!res.ok) {
    throw new Error(`La búsqueda en Edamam respondió ${res.status}`);
  }
  return (await res.json()) as MealSummary[];
}
