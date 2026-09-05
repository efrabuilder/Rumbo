"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Pin propio en HTML/CSS: evita depender de los íconos por defecto de
// Leaflet (que no cargan bien con bundlers como Next.js sin configuración
// extra).
function pin(label, { active = false } = {}) {
  const bg = active ? "#f5a83c" : "#182444";
  const border = active ? "#f5a83c" : "#3fc3ea";
  const color = active ? "#0b0f1c" : "#eef1fb";
  return L.divIcon({
    className: "",
    html: `<div style="
      transform: translate(-50%, -100%);
      background: ${bg};
      color: ${color};
      border: 1.5px solid ${border};
      font-family: Inter, system-ui, sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 999px;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    ">${label}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Recentra el mapa cuando cambia el destino activo (react-leaflet no lo
// hace solo si el <MapContainer> ya está montado).
function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lon != null) map.setView([lat, lon], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);
  return null;
}

function ClickCatcher({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Trae el frame de radar más reciente de RainViewer (gratis, sin API key).
function useRadarFrame(enabled) {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    if (!enabled || frame) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        const past = data?.radar?.past;
        const last = past?.[past.length - 1];
        if (!cancelled && last) {
          setFrame({ host: data.host, path: last.path, time: last.time });
        }
      } catch (e) {
        // sin radar disponible, el mapa sigue funcionando igual
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, frame]);

  return frame;
}

export default function MapPicker({ destination, favorites, showRadar, onPick, onSelectFavorite }) {
  const radarFrame = useRadarFrame(showRadar);

  const radarUrl = useMemo(() => {
    if (!radarFrame) return null;
    return `${radarFrame.host}${radarFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  }, [radarFrame]);

  const center = [destination?.lat ?? 38.7, destination?.lon ?? -9.14];

  return (
    <MapContainer
      center={center}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#121a2e" }}
    >
      {/* Teselas estándar de OpenStreetMap (gratis, sin API key). El filtro
          CSS las invierte para que se vean oscuras, acordes al tema de la
          app, sin depender de un proveedor que exija registro. */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className="map-tiles-dark"
      />

      {radarUrl && <TileLayer key={radarUrl} url={radarUrl} opacity={0.55} zIndex={5} />}

      <ClickCatcher onPick={onPick} />
      <Recenter lat={destination?.lat} lon={destination?.lon} />

      {favorites
        .filter((f) => !destination || f.name !== destination.name || f.country !== destination.country)
        .map((f) => (
          <Marker
            key={f.name + f.country}
            position={[f.lat, f.lon]}
            icon={pin(`${f.name} · ${f.temp}°`)}
            eventHandlers={{ click: () => onSelectFavorite(f) }}
          />
        ))}

      {destination && (
        <Marker
          position={[destination.lat, destination.lon]}
          icon={pin(destination.name, { active: true })}
        />
      )}
    </MapContainer>
  );
}
