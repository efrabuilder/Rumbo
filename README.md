# Rumbo

Dashboard de clima + conversor de moneda para planear viajes, hecho con Next.js.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## Por qué no funcionaba en la vista previa del chat

El clima y la conversión no cargaban datos porque el entorno donde se muestra
el artifact de React dentro del chat bloquea las llamadas `fetch` a APIs
externas (política de seguridad del navegador integrado). No es un problema
de las APIs ni del código: es una restricción del sandbox de vista previa.
Corriendo el proyecto de verdad (local o desplegado), esa restricción no
existe y todo funciona normal.

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
