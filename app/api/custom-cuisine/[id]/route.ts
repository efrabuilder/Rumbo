import { NextResponse } from 'next/server';
import { getEdamamMealById } from '@/lib/edamam';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return getEdamamMealById(params.id)
    .then((meal) =>
      meal
        ? NextResponse.json(meal)
        : NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    )
    .catch(() =>
      NextResponse.json(
        { error: 'No se pudo consultar Edamam' },
        { status: 500 }
      )
    );
}
