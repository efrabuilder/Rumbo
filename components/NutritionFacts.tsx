import type { NutritionInfo } from '@/types/meal';

interface NutritionFactsProps {
  nutrition: NutritionInfo | undefined;
}

export default function NutritionFacts({ nutrition }: NutritionFactsProps) {
  if (!nutrition) {
    return (
      <div className="nutrition-facts">
        <h2>Valores nutricionales</h2>
        <p className="nutrition-unavailable">
          Esta receta no tiene valores nutricionales disponibles. Las
          recetas que vienen del buscador por país (Spoonacular) sí los
          incluyen.
        </p>
      </div>
    );
  }

  const rows = [
    { label: 'Calorías', value: nutrition.calories },
    { label: 'Carbohidratos', value: nutrition.carbs },
    { label: 'Grasas', value: nutrition.fat },
    { label: 'Proteína', value: nutrition.protein },
    { label: 'Sodio (sal)', value: nutrition.sodium },
  ];

  return (
    <div className="nutrition-facts">
      <h2>Valores nutricionales</h2>
      <ul className="nutrition-list">
        {rows.map((row) => (
          <li key={row.label}>
            <span>{row.label}</span>
            <span className="nutrition-value">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="nutrition-note">Valores estimados por porción.</p>
    </div>
  );
}
