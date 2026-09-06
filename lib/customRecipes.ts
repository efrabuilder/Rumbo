import { createClient } from '@supabase/supabase-js';
import type { Ingredient, MealDetail, MealSummary, NutritionInfo } from '@/types/meal';

const CUSTOM_PREFIX = 'custom-';

export function isCustomRecipeId(id: string): boolean {
  return id.startsWith(CUSTOM_PREFIX);
}

export function stripCustomPrefix(id: string): string {
  return id.slice(CUSTOM_PREFIX.length);
}

/**
 * Fila esperada en la tabla `custom_recipes` de Supabase. `ingredients` y
 * `nutrition` se guardan como columnas jsonb con esta misma forma.
 *
 * create table custom_recipes (
 *   id text primary key,
 *   name text not null,
 *   thumbnail text,
 *   category text,
 *   area text not null,
 *   instructions text,
 *   tags text[] default '{}',
 *   source_url text,
 *   ingredients jsonb not null default '[]',
 *   nutrition jsonb
 * );
 */
interface CustomRecipeRow {
  id: string;
  name: string;
  thumbnail: string | null;
  category: string | null;
  area: string;
  instructions: string | null;
  tags: string[] | null;
  source_url: string | null;
  ingredients: Ingredient[] | null;
  nutrition: NutritionInfo | null;
}

/**
 * Cliente de Supabase, o null si todavía no se configuraron las variables de
 * entorno. Cuando es null, las funciones de este archivo devuelven listas
 * vacías en vez de romper la app: las recetas propias son un "plus" opcional,
 * no un requisito para que el resto funcione.
 */
function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function toSummary(row: CustomRecipeRow): MealSummary {
  return {
    id: `${CUSTOM_PREFIX}${row.id}`,
    name: row.name,
    thumbnail: row.thumbnail,
    category: row.category ?? undefined,
    area: row.area,
  };
}

function toDetail(row: CustomRecipeRow): MealDetail {
  return {
    ...toSummary(row),
    instructions: row.instructions,
    tags: row.tags ?? [],
    youtubeUrl: null,
    sourceUrl: row.source_url,
    ingredients: row.ingredients ?? [],
    nutrition: row.nutrition ?? undefined,
  };
}

/**
 * Lista de países distintos entre las recetas propias. Se usa para sumarlos
 * al selector de país de la home, que si no, solo mostraría las áreas que ya
 * trae el catálogo de TheMealDB (justo los países que las recetas propias
 * están pensadas para completar quedarían invisibles en el dropdown).
 */
export async function getCustomAreas(): Promise<string[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client.from('custom_recipes').select('area');
  if (error || !data) return [];

  const unique = new Set((data as { area: string }[]).map((row) => row.area));
  return Array.from(unique);
}

/**
 * Llamada desde el navegador (la home) a nuestra propia ruta
 * /api/custom-areas.
 */
export async function fetchCustomAreas(): Promise<string[]> {
  const res = await fetch('/api/custom-areas');
  if (!res.ok) {
    throw new Error(`La consulta de países propios respondió ${res.status}`);
  }
  return (await res.json()) as string[];
}

/** Recetas propias para un país/área puntual (para completar el filtro por región). */
export async function getCustomRecipesByArea(area: string): Promise<MealSummary[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('custom_recipes')
    .select('*')
    .ilike('area', area);

  if (error || !data) return [];
  return (data as CustomRecipeRow[]).map(toSummary);
}

/**
 * Llamada desde el navegador (componente cliente, ej. la home) a nuestra
 * propia ruta /api/custom-cuisine. Aunque la anon key de Supabase está
 * pensada para exponerse, la resolvemos en el servidor igual que Spoonacular
 * y Edamam para mantener un único patrón en todo el proyecto.
 */
export async function fetchCustomRecipesByArea(area: string): Promise<MealSummary[]> {
  const res = await fetch(`/api/custom-cuisine?area=${encodeURIComponent(area)}`);
  if (!res.ok) {
    throw new Error(`La consulta de recetas propias respondió ${res.status}`);
  }
  return (await res.json()) as MealSummary[];
}

export async function getCustomRecipeById(id: string): Promise<MealDetail | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('custom_recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return toDetail(data as CustomRecipeRow);
}

/**
 * Llamada desde el navegador (ej. la página de favoritos) a nuestra propia
 * ruta /api/custom-recipe/[id], que es la que habla con Supabase.
 */
export async function fetchCustomRecipeSummary(id: string): Promise<MealSummary | null> {
  const res = await fetch(`/api/custom-recipe/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`La consulta de la receta propia respondió ${res.status}`);
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
