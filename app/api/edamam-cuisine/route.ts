import { NextResponse } from 'next/server';
import { searchEdamamByCuisine } from '@/lib/edamam';

export async function GET(request: Request): Promise<NextResponse> {
  const cuisine = new URL(request.url).searchParams.get('cuisine') ?? '';

  return searchEdamamByCuisine(cuisine)
    .then((meals) => NextResponse.json(meals))
    .catch(() =>
      NextResponse.json(
        { error: 'No se pudo consultar Edamam' },
        { status: 500 }
      )
    );
}
