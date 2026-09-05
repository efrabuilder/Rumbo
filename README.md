# Rumbo

Dashboard de clima + conversor de moneda para planear viajes, hecho con Next.js.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-blue)


## APIs usadas

Todo gratis, pero **una** requiere una cuenta (sin tarjeta):

- **Clima:** [Open-Meteo](https://open-meteo.com/) — geocodificación + pronóstico. Sin API key.
- **Moneda:** [Frankfurter](https://www.frankfurter.app/) — tasas de cambio del Banco Central Europeo. Sin API key.
- **Mapa base:** [MapTiler](https://www.maptiler.com/) (mapas vectoriales, con soporte de idioma — por eso las etiquetas salen en español). *Requiere una API key gratuita, sin tarjeta:* creá una cuenta en [cloud.maptiler.com](https://cloud.maptiler.com/account/keys/), copiá tu key y ponela en un archivo `.env.local` (mirá `.env.example`) como `NEXT_PUBLIC_MAPTILER_KEY=tu_key`. *Nota: antes usábamos teselas de imagen (OpenStreetMap/CARTO) que no permiten elegir idioma; para tener nombres en español hacía falta pasar a mapas vectoriales, y eso trae la necesidad de esta key gratuita.*
- **Geocodificación inversa (click en el mapa):** [Nominatim](https://nominatim.org/release-docs/latest/api/Reverse/) de OpenStreetMap. Gratis, sin key, con límite de uso (~1 request/seg); para tráfico alto en producción conviene un servicio propio o de pago.
- **Radar de precipitación:** [RainViewer](https://www.rainviewer.com/api.html) — mosaico global de radar meteorológico. Sin API key. *Su cobertura depende de qué tan densa es la red de radares meteorológicos del país — en EE.UU./Europa es muy detallada; en otras regiones puede verse vacía aunque esté lloviendo, porque no es que falte "actualizar" el mapa, es que no hay estación de radar cerca alimentando esos datos.*

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # y completá tu key de MapTiler
npm run dev
```

Abrí http://localhost:3000

## Estructura

- `app/page.js` — toda la lógica y la interfaz (nav, clima, mapa, conversor).
- `app/components/MapPicker.js` — mapa interactivo (MapTiler + MapLibre GL)
  con selección por click, etiquetas en español y overlay de radar de
  precipitación.
- `app/layout.js` — layout raíz y metadata.
- `app/globals.css` — Tailwind + fuentes (Fraunces / Inter).
- `tailwind.config.js` — paleta de colores del dashboard.

## Funciones

- **Búsqueda por texto** (como antes) o **por mapa**: tocá cualquier punto
  del mapa en la tarjeta "Buscar en el mapa" y la app resuelve el lugar
  (Nominatim) y trae su clima.
- **Radar de precipitación**: botón "Precipitación: ON/OFF" sobre el mapa,
  con datos de RainViewer.
- El conversor detecta automáticamente la moneda del país buscado (para
  monedas que soporta Frankfurter) y la deja preseleccionada como destino.
- **Destinos guardados**: ahora persisten en `localStorage` del navegador
  (clave `rumbo:favoritos`), así que sobreviven a un refresh o a cerrar la
  pestaña. Se pueden quitar individualmente con el botón "✕". Siguen sin
  sincronizarse entre dispositivos (para eso haría falta una cuenta +
  base de datos).
- Interfaz mobile con tab bar fija abajo (Resumen / Mapa / Convertir /
  Guardados), inspirada en apps nativas tipo Clima de iPhone.
