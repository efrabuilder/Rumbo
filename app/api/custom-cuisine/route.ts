import { NextResponse } from 'next/server';
import { getCustomRecipesByArea } from '@/lib/customRecipes';

export async function GET(request: Request): Promise<NextResponse> {
  const area = new URL(request.url).searchParams.get('area') ?? '';

  return getCustomRecipesByArea(area)
    .then((meals) => NextResponse.json(meals))
    .catch(() =>
      NextResponse.json(
        { error: 'No se pudieron consultar las recetas propias' },
        { status: 500 }
      )
    );
}
