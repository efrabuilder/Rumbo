# Rumbo

Dashboard de clima + conversor de moneda para planear viajes, hecho con Next.js.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-blue)


## APIs gratuitas usadas (sin necesidad de API key)

- **Clima:** [Open-Meteo](https://open-meteo.com/) — geocodificación + pronóstico.
- **Moneda:** [Frankfurter](https://www.frankfurter.app/) — tasas de cambio del Banco Central Europeo.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Estructura

- `app/page.js` — toda la lógica y la interfaz (sidebar, clima, conversor).
- `app/layout.js` — layout raíz y metadata.
- `app/globals.css` — Tailwind + fuentes (Fraunces / Inter).
- `tailwind.config.js` — paleta de colores del dashboard.

## Notas

- El conversor detecta automáticamente la moneda del país buscado (para
  monedas que soporta Frankfurter) y la deja preseleccionada como destino.
- Los "Destinos guardados" se guardan en memoria mientras la pestaña está
  abierta (no hay base de datos ni almacenamiento persistente todavía).
