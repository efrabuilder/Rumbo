# Rumbo

Dashboard de clima + conversor de moneda para planear viajes, hecho con Next.js.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-blue)


## APIs gratuitas usadas (sin necesidad de API key)

- **Clima:** [Open-Meteo](https://open-meteo.com/) — geocodificación + pronóstico.
- **Moneda:** [Frankfurter](https://www.frankfurter.app/) — tasas de cambio del Banco Central Europeo.
- **Mapa base:** teselas estándar de [OpenStreetMap](https://www.openstreetmap.org/copyright) (gratis, sin API key), invertidas con un filtro CSS para que se vean oscuras. *Nota: antes usábamos CARTO, pero sus teselas dejaron de ser gratis sin registro (ahora piden API key), así que se cambió a OSM.*
- **Geocodificación inversa (click en el mapa):** [Nominatim](https://nominatim.org/release-docs/latest/api/Reverse/) de OpenStreetMap. Es un servicio gratuito con límite de uso (~1 request/seg); para tráfico alto en producción conviene un servicio propio o de pago.
- **Radar de precipitación:** [RainViewer](https://www.rainviewer.com/api.html) — mosaico global de radar meteorológico.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí http://localhost:3000

## Estructura

- `app/page.js` — toda la lógica y la interfaz (nav, clima, mapa, conversor).
- `app/components/MapPicker.js` — mapa interactivo (Leaflet) con selección
  por click y overlay de radar de precipitación.
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
