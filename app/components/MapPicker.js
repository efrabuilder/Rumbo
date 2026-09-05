"use client";

import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const RADAR_SOURCE_ID = "rumbo-radar-source";
const RADAR_LAYER_ID = "rumbo-radar-layer";

function pinElement(label, { active = false } = {}) {
  const el = document.createElement("div");
  el.textContent = label;
  el.style.transform = "translateY(-4px)";
  el.style.background = active ? "#f5a83c" : "#182444";
  el.style.color = active ? "#0b0f1c" : "#eef1fb";
  el.style.border = `1.5px solid ${active ? "#f5a83c" : "#3fc3ea"}`;
  el.style.fontFamily = "Inter, system-ui, sans-serif";
  el.style.fontSize = "11px";
  el.style.fontWeight = "600";
  el.style.padding = "3px 8px";
  el.style.borderRadius = "999px";
  el.style.whiteSpace = "nowrap";
  el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.35)";
  el.style.cursor = "pointer";
  return el;
}

// Trae el frame de radar más reciente de RainViewer (gratis, sin API key).
// Devuelve null apenas se apaga el switch, así la próxima vez que se
// prenda pide un frame nuevo en lugar de reusar uno viejo.
function useRadarFrame(enabled) {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setFrame(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await res.json();
        const past = data?.radar?.past;
        const last = past?.[past.length - 1];
        if (!cancelled && last) setFrame({ host: data.host, path: last.path });
      } catch (e) {
        // sin radar disponible, el mapa sigue funcionando igual
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return frame;
}

export default function MapPicker({ destination, favorites, showRadar, onPick, onSelectFavorite }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const styleReadyRef = useRef(false);
  const destMarkerRef = useRef(null);
  const favMarkersRef = useRef([]);
  const onPickRef = useRef(onPick);
  const onSelectFavoriteRef = useRef(onSelectFavorite);
  onPickRef.current = onPick;
  onSelectFavoriteRef.current = onSelectFavorite;

  const radarFrame = useRadarFrame(showRadar);

  // Crea el mapa una sola vez.
  useEffect(() => {
    if (!MAPTILER_KEY || mapRef.current) return;
    maptilersdk.config.apiKey = MAPTILER_KEY;

    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: maptilersdk.MapStyle.STREETS.DARK,
      language: "es",
      center: [destination?.lon ?? -9.14, destination?.lat ?? 38.7],
      zoom: 5,
    });

    map.on("click", (e) => onPickRef.current(e.lngLat.lat, e.lngLat.lng));
    map.on("load", () => {
      styleReadyRef.current = true;
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      styleReadyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recentra el mapa cuando cambia el destino activo.
  useEffect(() => {
    const map = mapRef.current;
    if (map && destination) {
      map.easeTo({ center: [destination.lon, destination.lat], zoom: Math.max(map.getZoom(), 5) });
    }
  }, [destination?.lat, destination?.lon]);

  // Pin del destino activo.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    if (destination) {
      destMarkerRef.current = new maptilersdk.Marker({ element: pinElement(destination.name, { active: true }) })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);
    }
  }, [destination]);

  // Pines de los destinos guardados.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    favMarkersRef.current.forEach((m) => m.remove());
    favMarkersRef.current = favorites
      .filter((f) => !destination || f.name !== destination.name || f.country !== destination.country)
      .map((f) => {
        const el = pinElement(`${f.name} · ${f.temp}°`);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelectFavoriteRef.current(f);
        });
        return new maptilersdk.Marker({ element: el }).setLngLat([f.lon, f.lat]).addTo(map);
      });
  }, [favorites, destination]);

  // Capa de radar de precipitación (RainViewer).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyRadar = () => {
      if (map.getLayer(RADAR_LAYER_ID)) map.removeLayer(RADAR_LAYER_ID);
      if (map.getSource(RADAR_SOURCE_ID)) map.removeSource(RADAR_SOURCE_ID);
      if (radarFrame) {
        map.addSource(RADAR_SOURCE_ID, {
          type: "raster",
          tiles: [`${radarFrame.host}${radarFrame.path}/256/{z}/{x}/{y}/4/1_1.png`],
          tileSize: 256,
        });
        map.addLayer({
          id: RADAR_LAYER_ID,
          type: "raster",
          source: RADAR_SOURCE_ID,
          paint: { "raster-opacity": 0.75 },
        });
      }
    };

    if (styleReadyRef.current) applyRadar();
    else map.once("load", applyRadar);
  }, [radarFrame]);

  if (!MAPTILER_KEY) {
    return (
      <div className="h-full w-full flex items-center justify-center text-center text-sm text-inkSoft p-6">
        Falta configurar la clave gratuita de MapTiler. Creá una cuenta en{" "}
        <a href="https://cloud.maptiler.com/account/keys/" target="_blank" rel="noreferrer" className="text-sky underline mx-1">
          cloud.maptiler.com
        </a>{" "}
        y poné la key en la variable <code className="mx-1">NEXT_PUBLIC_MAPTILER_KEY</code>.
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
