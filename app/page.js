"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Leaflet necesita `window`, así que el mapa se carga solo en el cliente.
const MapPicker = dynamic(() => import("./components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-sm text-inkSoft">
      Cargando mapa…
    </div>
  ),
});

const FAVORITES_KEY = "rumbo:favoritos";

const CURRENCY_INFO = {
  USD: { label: "Dólar estadounidense", flag: "🇺🇸" },
  EUR: { label: "Euro", flag: "🇪🇺" },
  JPY: { label: "Yen japonés", flag: "🇯🇵" },
  GBP: { label: "Libra esterlina", flag: "🇬🇧" },
  AUD: { label: "Dólar australiano", flag: "🇦🇺" },
  CAD: { label: "Dólar canadiense", flag: "🇨🇦" },
  CHF: { label: "Franco suizo", flag: "🇨🇭" },
  CNY: { label: "Yuan chino", flag: "🇨🇳" },
  SEK: { label: "Corona sueca", flag: "🇸🇪" },
  NZD: { label: "Dólar neozelandés", flag: "🇳🇿" },
  MXN: { label: "Peso mexicano", flag: "🇲🇽" },
  SGD: { label: "Dólar de Singapur", flag: "🇸🇬" },
  HKD: { label: "Dólar de Hong Kong", flag: "🇭🇰" },
  NOK: { label: "Corona noruega", flag: "🇳🇴" },
  KRW: { label: "Won surcoreano", flag: "🇰🇷" },
  TRY: { label: "Lira turca", flag: "🇹🇷" },
  INR: { label: "Rupia india", flag: "🇮🇳" },
  BRL: { label: "Real brasileño", flag: "🇧🇷" },
  ZAR: { label: "Rand sudafricano", flag: "🇿🇦" },
  DKK: { label: "Corona danesa", flag: "🇩🇰" },
  PLN: { label: "Zloty polaco", flag: "🇵🇱" },
  THB: { label: "Baht tailandés", flag: "🇹🇭" },
  IDR: { label: "Rupia indonesia", flag: "🇮🇩" },
  CZK: { label: "Corona checa", flag: "🇨🇿" },
  ILS: { label: "Séquel israelí", flag: "🇮🇱" },
  PHP: { label: "Peso filipino", flag: "🇵🇭" },
  MYR: { label: "Ringgit malasio", flag: "🇲🇾" },
  RON: { label: "Leu rumano", flag: "🇷🇴" },
  CRC: { label: "Colón costarricense", flag: "🇨🇷" },
};

const COUNTRY_TO_CURRENCY = {
  JP: "JPY", US: "USD", GB: "GBP", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR",
  PT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  MX: "MXN", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", CN: "CNY", SE: "SEK",
  SG: "SGD", HK: "HKD", NO: "NOK", KR: "KRW", TR: "TRY", IN: "INR", BR: "BRL",
  ZA: "ZAR", DK: "DKK", PL: "PLN", TH: "THB", ID: "IDR", CZ: "CZK", IL: "ILS",
  PH: "PHP", MY: "MYR", RO: "RON", CR: "CRC",
};

// Frankfurter (BCE) no cubre todas las monedas; para las que le faltan
// (ej. CRC) se usa directo la API de respaldo.
const FRANKFURTER_UNSUPPORTED = new Set(["CRC"]);

const NAV_ITEMS = [
  { id: "resumen", label: "Resumen", icon: "home" },
  { id: "mapa", label: "Mapa", icon: "map" },
  { id: "convertir", label: "Convertir", icon: "swap" },
  { id: "guardados", label: "Guardados", icon: "star" },
];

function NavIcon({ name, size = 20 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 5l8 6.5M6 10v9h5v-5h2v5h5v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "swap":
      return (
        <svg {...common}>
          <path d="M7 7h11m0 0-3.5-3.5M18 7l-3.5 3.5M17 17H6m0 0 3.5 3.5M6 17l3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="m12 4 2.4 5.2 5.6.6-4.2 3.9 1.2 5.6L12 16.6 6.9 19.3l1.2-5.6-4.2-3.9 5.6-.6L12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

function weatherInfo(code, isDay = true) {
  if (code === 0) return { label: isDay ? "Cielo despejado" : "Noche despejada", icon: "sun" };
  if ([1, 2].includes(code)) return { label: "Parcialmente nublado", icon: "cloud-sun" };
  if (code === 3) return { label: "Nublado", icon: "cloud" };
  if ([45, 48].includes(code)) return { label: "Niebla", icon: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Llovizna", icon: "rain" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Lluvia", icon: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Nieve", icon: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Tormenta", icon: "storm" };
  return { label: "—", icon: "cloud" };
}

function WeatherIcon({ name, size = 32, className = "" }) {
  const common = { width: size, height: size, viewBox: "0 0 48 48", fill: "none", className };
  switch (name) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="9" stroke="#f5a83c" strokeWidth="2.4" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="24" y1="5" x2="24" y2="10" stroke="#f5a83c" strokeWidth="2.4"
              strokeLinecap="round" transform={`rotate(${a} 24 24)`} />
          ))}
        </svg>
      );
    case "cloud-sun":
      return (
        <svg {...common}>
          <circle cx="17" cy="15" r="6.5" stroke="#f5a83c" strokeWidth="2" />
          <path d="M10 33a8 8 0 0 1 3-15.4A10 10 0 0 1 32 21a7 7 0 0 1-1 12H10Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
    case "fog":
      return (
        <svg {...common}>
          <path d="M9 20a8 8 0 0 1 3-15 10 10 0 0 1 19.5 3.4A7 7 0 0 1 31 22H9Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
          {[27, 33, 39].map((y) => (
            <line key={y} x1="8" y1={y} x2="40" y2={y} stroke="#3fc3ea" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          ))}
        </svg>
      );
    case "rain":
      return (
        <svg {...common}>
          <path d="M10 22a8 8 0 0 1 3-15.4A10 10 0 0 1 32 10a7 7 0 0 1-1 12H10Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
          {[16, 24, 32].map((x) => (
            <line key={x} x1={x} y1="30" x2={x - 3} y2="40" stroke="#f5a83c" strokeWidth="2.4" strokeLinecap="round" />
          ))}
        </svg>
      );
    case "snow":
      return (
        <svg {...common}>
          <path d="M10 22a8 8 0 0 1 3-15.4A10 10 0 0 1 32 10a7 7 0 0 1-1 12H10Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
          {[17, 24, 31].map((x) => (
            <circle key={x} cx={x} cy="36" r="1.8" fill="#f5a83c" />
          ))}
        </svg>
      );
    case "storm":
      return (
        <svg {...common}>
          <path d="M10 20a8 8 0 0 1 3-15.4A10 10 0 0 1 32 8a7 7 0 0 1-1 12H10Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M25 24 18 34h6l-3 8 10-13h-6l3-5Z" fill="#f5a83c" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M10 32a8 8 0 0 1 3-15.4A10 10 0 0 1 32 20a7 7 0 0 1-1 12H10Z"
            stroke="#3fc3ea" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
  }
}

function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M7 7h11m0 0-3.5-3.5M18 7l-3.5 3.5M17 17H6m0 0 3.5 3.5M6 17l3.5-3.5"
        stroke="#f5a83c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Obtiene la tasa de cambio. Intenta primero Frankfurter (BCE); si falla,
// si no soporta la moneda, o si la conexión da error, usa open.er-api.com
// como respaldo (también gratis, sin API key).
async function fetchRate(amount, from, to) {
  const amt = Number(amount) || 0;
  if (from === to) return { rates: { [to]: amt }, date: null, source: "same" };

  const canUseFrankfurter = !FRANKFURTER_UNSUPPORTED.has(from) && !FRANKFURTER_UNSUPPORTED.has(to);

  if (canUseFrankfurter) {
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?amount=${amt}&from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.rates?.[to] != null) {
          return { rates: data.rates, date: data.date, source: "frankfurter" };
        }
      }
    } catch (e) {
      // seguimos al respaldo
    }
  }

  const res2 = await fetch(`https://open.er-api.com/v6/latest/${from}`);
  if (!res2.ok) throw new Error("No se pudo contactar ningún servicio de tasas de cambio.");
  const data2 = await res2.json();
  if (data2.result !== "success" || data2.rates?.[to] == null) {
    throw new Error(`No hay tasa disponible para ${from} → ${to}.`);
  }
  const date = data2.time_last_update_utc ? data2.time_last_update_utc.slice(0, 16) : null;
  return { rates: { [to]: data2.rates[to] * amt }, date, source: "open.er-api" };
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [destination, setDestination] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [activeNav, setActiveNav] = useState("resumen");

  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const [amount, setAmount] = useState(100);
  const [fromCur, setFromCur] = useState("USD");
  const [toCur, setToCur] = useState("EUR");
  const [rateData, setRateData] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateError, setRateError] = useState("");

  const [showRadar, setShowRadar] = useState(false);
  const [mapError, setMapError] = useState("");

  // Carga los destinos guardados una sola vez al abrir la app.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FAVORITES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Corrige favoritos guardados con una versión anterior que podía
        // dejar "auto" como zona horaria (no es válida para el navegador).
        const sanitized = parsed.map((f) => (f.timezone === "auto" ? { ...f, timezone: null } : f));
        setFavorites(sanitized);
      }
    } catch (e) {
      // localStorage no disponible (modo privado, etc.); seguimos sin guardado
    }
  }, []);

  // Guarda cada cambio para que "Guardados" sobreviva a un refresh.
  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      // si falla, la app sigue funcionando, solo no persiste
    }
  }, [favorites]);

  // Busca coincidencias de ciudad y las muestra para que el usuario elija
  // la correcta (ej. "Atenas, Alajuela, Costa Rica" vs "Atenas, Grecia").
  const searchPlaces = useCallback(async (text) => {
    if (!text.trim()) return;
    setSearchError("");
    setSuggestions([]);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=8&language=es&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setSearchError("No encontramos esa ciudad. Probá con otro nombre o agregá el país (ej. \"Atenas, Costa Rica\").");
        return;
      }
      if (geoData.results.length === 1) {
        selectPlace(geoData.results[0]);
      } else {
        setSuggestions(geoData.results);
      }
    } catch (e) {
      setSearchError("No se pudo buscar la ciudad. Revisá tu conexión e intentá de nuevo.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPlace = useCallback(async (g) => {
    setSuggestions([]);
    setSearchError("");
    setWeatherError("");
    setMapError("");
    setLoadingWeather(true);
    // "auto" le pide a Open-Meteo que resuelva la zona horaria real (hace
    // falta para los lugares que vienen del mapa, Nominatim no la incluye).
    // Ojo: "auto" es solo un valor para ESE pedido, nunca es una zona
    // horaria válida para el navegador (Intl), así que en `dest.timezone`
    // guardamos null hasta tener la zona real.
    const hasValidTz = g.timezone && g.timezone !== "auto";
    const requestedTz = hasValidTz ? g.timezone : "auto";
    const dest = {
      name: g.name,
      admin1: g.admin1 || "",
      country: g.country,
      countryCode: g.country_code,
      lat: g.latitude,
      lon: g.longitude,
      timezone: hasValidTz ? g.timezone : null,
    };
    setDestination(dest);

    const currency = COUNTRY_TO_CURRENCY[g.country_code] || "USD";
    if (CURRENCY_INFO[currency]) {
      setToCur(currency);
      setFromCur(currency === "USD" ? "EUR" : "USD");
    }

    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
          `&hourly=temperature_2m,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
          `&forecast_days=7&timezone=${encodeURIComponent(requestedTz)}`
      );
      const wData = await wRes.json();
      const resolvedTz = wData.timezone || dest.timezone || null;
      const resolvedDest = { ...dest, timezone: resolvedTz };
      if (resolvedTz !== dest.timezone) setDestination(resolvedDest);
      setWeather(wData);
      setUpdatedAt(new Date());

      setFavorites((prev) => {
        const withoutDup = prev.filter((f) => !(f.name === resolvedDest.name && f.country === resolvedDest.country));
        return [{ ...resolvedDest, temp: Math.round(wData?.current?.temperature_2m ?? 0) }, ...withoutDup].slice(0, 6);
      });
    } catch (e) {
      setWeatherError("No se pudo conectar con el servicio de clima. Revisá tu conexión e intentá otra vez.");
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  // Convierte un punto del mapa (lat/lon) en un lugar buscable, usando
  // geocodificación inversa gratuita de OpenStreetMap (Nominatim).
  const handleMapPick = useCallback(async (lat, lon) => {
    setMapError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=es&zoom=10`
      );
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.city || addr.town || addr.village || addr.municipality || addr.county || data.name;
      if (!name) {
        setMapError("Ese punto parece estar en medio del mar u otra zona sin datos. Probá otro lugar del mapa.");
        return;
      }
      selectPlace({
        name,
        admin1: addr.state || addr.region || "",
        country: addr.country || "",
        country_code: (addr.country_code || "").toUpperCase(),
        latitude: lat,
        longitude: lon,
        timezone: "auto",
      });
    } catch (e) {
      setMapError("No se pudo identificar ese punto del mapa. Revisá tu conexión e intentá de nuevo.");
    }
  }, [selectPlace]);

  const removeFavorite = useCallback((fav) => {
    setFavorites((prev) => prev.filter((f) => !(f.name === fav.name && f.country === fav.country)));
  }, []);

  useEffect(() => {
    // primera carga: selecciona directo Lisboa, Portugal (sin mostrar sugerencias)
    (async () => {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=Lisbon&count=1&language=es&format=json`
      );
      const geoData = await geoRes.json();
      if (geoData.results?.[0]) selectPlace(geoData.results[0]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function getRate() {
      setLoadingRate(true);
      setRateError("");
      try {
        const data = await fetchRate(amount, fromCur, toCur);
        if (!cancelled) setRateData(data);
      } catch (e) {
        if (!cancelled) {
          setRateError(e.message || "No se pudo obtener la tasa de cambio.");
          setRateData(null);
        }
      } finally {
        if (!cancelled) setLoadingRate(false);
      }
    }
    getRate();
    return () => {
      cancelled = true;
    };
  }, [amount, fromCur, toCur]);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchPlaces(query);
  };

  const swapCurrencies = () => {
    setFromCur(toCur);
    setToCur(fromCur);
  };

  const step = (delta) => {
    setAmount((prev) => {
      const next = (Number(prev) || 0) + delta;
      return next < 0 ? 0 : next;
    });
  };

  const hourlySeries = useMemo(() => {
    if (!weather?.hourly || !weather?.current) return [];
    const nowTime = weather.current.time;
    let startIdx = weather.hourly.time.findIndex((t) => t >= nowTime);
    if (startIdx < 0) startIdx = 0;
    return weather.hourly.time.slice(startIdx, startIdx + 12).map((t, i) => ({
      hour: new Date(t).toLocaleTimeString("es-ES", { hour: "2-digit" }),
      temp: Math.round(weather.hourly.temperature_2m[startIdx + i]),
    }));
  }, [weather]);

  const current = weather?.current;
  const daily = weather?.daily;
  const info = current ? weatherInfo(current.weather_code, current.is_day) : null;
  const converted = rateData?.rates?.[toCur];

  const goToFavorite = (f) =>
    selectPlace({
      name: f.name, admin1: f.admin1, country: f.country, country_code: f.countryCode,
      latitude: f.lat, longitude: f.lon, timezone: f.timezone,
    });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-60 shrink-0 md:border-r border-line bg-surface px-5 py-6 md:flex-col gap-8">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Rumbo</h1>
          <p className="text-inkSoft text-xs mt-1">Clima y moneda para tu próximo viaje</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeNav === item.id
                  ? "bg-surface2 text-ink"
                  : "text-inkSoft hover:text-ink hover:bg-surface2/60"
              }`}
            >
              <NavIcon name={item.icon} size={17} />
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Header (mobile) */}
      <div className="md:hidden px-5 pt-6 pb-2">
        <h1 className="font-display text-2xl tracking-tight">Rumbo</h1>
      </div>

      {/* Tab bar fija (mobile), estilo apps nativas de iOS */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                activeNav === item.id ? "text-amber" : "text-inkSoft"
              }`}
            >
              <NavIcon name={item.icon} size={20} />
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 px-5 py-6 pb-24 md:pb-8 md:px-8 md:py-8 max-w-5xl mx-auto w-full" id="resumen">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2 relative">
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ciudad (ej. Atenas, Costa Rica)"
              className="flex-1 bg-surface border border-line rounded-xl px-4 py-2.5 text-sm placeholder:text-inkSoft focus:outline-none focus:ring-2 focus:ring-sky/60"
            />
            <button
              type="submit"
              className="bg-sky text-canvas font-semibold text-sm px-4 py-2.5 rounded-xl hover:brightness-110 transition"
            >
              Buscar
            </button>
          </form>
          <span className="inline-flex items-center gap-2 text-xs text-inkSoft bg-surface border border-line rounded-full px-3 py-1.5 self-start sm:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-sky" />
            {updatedAt
              ? `Actualizado ${updatedAt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`
              : "En vivo"}
          </span>

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[420px] mt-2 bg-surface border border-line rounded-xl overflow-hidden z-10 shadow-xl">
              <p className="text-xs text-inkSoft px-4 pt-3 pb-1">Elegí el lugar correcto</p>
              {suggestions.map((s) => (
                <button
                  key={`${s.id}-${s.latitude}`}
                  onClick={() => selectPlace(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface2 text-sm flex items-center justify-between gap-3"
                >
                  <span className="text-ink">{s.name}</span>
                  <span className="text-inkSoft text-xs truncate">
                    {[s.admin1, s.country].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {searchError && (
          <div className="bg-surface border border-line rounded-xl px-4 py-3 text-sm text-red-300 mb-4 mt-2">
            {searchError}
          </div>
        )}

        <div className="mb-6" />

        {weatherError && (
          <div className="bg-surface border border-line rounded-xl px-4 py-3 text-sm text-red-300 mb-6">
            {weatherError}
          </div>
        )}

        {loadingWeather && !weather && (
          <div className="bg-surface border border-line rounded-xl px-4 py-8 text-center text-inkSoft text-sm mb-6">
            Buscando el clima…
          </div>
        )}

        {current && destination && (
          <>
            {/* Hero + conditions row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              {/* Now card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-surface2 to-surface border border-line rounded-xl2 p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-inkSoft text-sm">
                      {[destination.admin1, destination.country].filter(Boolean).join(", ")}
                    </p>
                    <h2 className="font-display text-2xl mt-0.5">{destination.name}</h2>
                  </div>
                  <WeatherIcon name={info.icon} size={48} />
                </div>
                <div className="flex items-end gap-4 mt-6">
                  <p className="font-display text-6xl leading-none">{Math.round(current.temperature_2m)}°</p>
                  <div className="mb-1">
                    <p className="text-sm text-ink">{info.label}</p>
                    {daily && (
                      <p className="text-xs text-inkSoft mt-0.5">
                        Máx {Math.round(daily.temperature_2m_max[0])}° · Mín {Math.round(daily.temperature_2m_min[0])}°
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Conditions card */}
              <div className="bg-surface border border-line rounded-xl2 p-5">
                <p className="text-xs text-inkSoft mb-4">Condiciones</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-inkSoft">Sensación</p>
                    <p className="text-lg text-ink mt-0.5">{Math.round(current.apparent_temperature)}°</p>
                  </div>
                  <div>
                    <p className="text-xs text-inkSoft">Humedad</p>
                    <p className="text-lg text-ink mt-0.5">{current.relative_humidity_2m}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-inkSoft">Viento</p>
                    <p className="text-lg text-ink mt-0.5">{Math.round(current.wind_speed_10m)} km/h</p>
                  </div>
                  <div>
                    <p className="text-xs text-inkSoft">Hora local</p>
                    <p className="text-lg text-ink mt-0.5">
                      {destination.timezone && destination.timezone !== "auto"
                        ? new Date().toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: destination.timezone,
                          })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div id="mapa" className="bg-surface border border-line rounded-xl2 p-5 mb-4">
              <div className="flex items-center justify-between mb-3 gap-3">
                <div>
                  <p className="text-xs text-inkSoft">Buscar en el mapa</p>
                  <p className="text-[11px] text-inkSoft/70 mt-0.5">Tocá cualquier punto para ver su clima</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRadar((v) => !v)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                    showRadar
                      ? "bg-sky/20 border-sky text-sky"
                      : "border-line text-inkSoft hover:text-ink"
                  }`}
                >
                  {showRadar ? "Precipitación: ON" : "Precipitación: OFF"}
                </button>
              </div>

              {mapError && <p className="text-xs text-red-300 mb-2">{mapError}</p>}

              <div className="h-72 md:h-96 rounded-lg overflow-hidden">
                <MapPicker
                  destination={destination}
                  favorites={favorites}
                  showRadar={showRadar}
                  onPick={handleMapPick}
                  onSelectFavorite={goToFavorite}
                />
              </div>
              <p className="text-[11px] text-inkSoft/70 mt-2">
                Mapa: MapTiler · Radar: RainViewer
              </p>
            </div>

            {/* Hourly trend + currency */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2 bg-surface border border-line rounded-xl2 p-5">
                <p className="text-xs text-inkSoft mb-2">Tendencia por hora</p>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hourlySeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#243158" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hour" stroke="#8d97bb" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#8d97bb" fontSize={11} tickLine={false} axisLine={false} width={32} />
                      <Tooltip
                        contentStyle={{ background: "#182444", border: "1px solid #243158", borderRadius: 8 }}
                        labelStyle={{ color: "#8d97bb" }}
                        formatter={(v) => [`${v}°`, "Temp"]}
                      />
                      <Line type="monotone" dataKey="temp" stroke="#3fc3ea" strokeWidth={2.2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Currency converter, integrado como tarjeta del dashboard */}
              <div id="convertir" className="bg-surface border border-line rounded-xl2 p-5">
                <p className="text-xs text-inkSoft mb-3">Conversor de moneda</p>

                <div className="flex items-stretch gap-2 mb-2">
                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="no-spinner flex-1 min-w-0 bg-surface2 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber/60"
                  />
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Aumentar monto"
                      onClick={() => step(1)}
                      className="w-8 h-4 rounded-md border border-line bg-surface2 text-amber text-xs leading-none flex items-center justify-center hover:border-amber transition"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      aria-label="Disminuir monto"
                      onClick={() => step(-1)}
                      className="w-8 h-4 rounded-md border border-line bg-surface2 text-amber text-xs leading-none flex items-center justify-center hover:border-amber transition"
                    >
                      −
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <select
                    value={fromCur}
                    onChange={(e) => setFromCur(e.target.value)}
                    className="flex-1 bg-surface2 border border-line rounded-lg px-2 py-2 text-sm"
                  >
                    {Object.keys(CURRENCY_INFO).map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_INFO[c].flag} {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={swapCurrencies}
                    aria-label="Intercambiar monedas"
                    className="shrink-0 w-9 h-9 rounded-lg border border-line bg-surface2 flex items-center justify-center hover:border-amber transition"
                  >
                    <SwapIcon />
                  </button>
                  <select
                    value={toCur}
                    onChange={(e) => setToCur(e.target.value)}
                    className="flex-1 bg-surface2 border border-line rounded-lg px-2 py-2 text-sm"
                  >
                    {Object.keys(CURRENCY_INFO).map((c) => (
                      <option key={c} value={c}>
                        {CURRENCY_INFO[c].flag} {c}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-[11px] text-inkSoft mb-2">
                  Sugerencia para {destination.name}: {CURRENCY_INFO[COUNTRY_TO_CURRENCY[destination.countryCode] || "USD"]?.flag}{" "}
                  {COUNTRY_TO_CURRENCY[destination.countryCode] || "USD"}
                </p>

                {rateError && <p className="text-xs text-red-300 mb-2">{rateError}</p>}

                <div className="border-t border-line pt-3">
                  {loadingRate ? (
                    <p className="text-sm text-inkSoft">Calculando…</p>
                  ) : (
                    converted != null && (
                      <>
                        <p className="font-display text-3xl">
                          {new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(converted)}{" "}
                          <span className="text-lg text-inkSoft">{toCur}</span>
                        </p>
                        <p className="text-xs text-inkSoft mt-1">
                          {CURRENCY_INFO[fromCur]?.label} → {CURRENCY_INFO[toCur]?.label}
                          {rateData?.date ? ` · tasa del ${rateData.date}` : ""}
                        </p>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* 7-day forecast */}
            {daily && (
              <div className="bg-surface border border-line rounded-xl2 p-5">
                <p className="text-xs text-inkSoft mb-3">Pronóstico de 7 días</p>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {daily.time.map((d, i) => {
                    const dInfo = weatherInfo(daily.weather_code[i], true);
                    const dayName = new Date(d + "T00:00:00").toLocaleDateString("es-ES", { weekday: "short" });
                    return (
                      <div key={d} className="bg-surface2 rounded-lg py-3 flex flex-col items-center gap-1.5">
                        <span className="text-xs text-inkSoft capitalize">{dayName}</span>
                        <WeatherIcon name={dInfo.icon} size={24} />
                        <span className="text-xs">
                          <span className="text-ink font-medium">{Math.round(daily.temperature_2m_max[i])}°</span>{" "}
                          <span className="text-inkSoft">{Math.round(daily.temperature_2m_min[i])}°</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Guardados */}
            <div id="guardados" className="bg-surface border border-line rounded-xl2 p-5 mt-4">
              <p className="text-xs text-inkSoft mb-3">Destinos guardados</p>
              {favorites.length === 0 ? (
                <p className="text-xs text-inkSoft/70">
                  Los lugares que busqués van a aparecer acá y se quedan guardados aunque cierres la app.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {favorites.map((f) => (
                    <div
                      key={f.name + f.country}
                      className="flex items-center justify-between gap-2 bg-surface2 rounded-lg pl-3 pr-1.5 py-1.5"
                    >
                      <button
                        onClick={() => goToFavorite(f)}
                        className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left"
                      >
                        <span className="text-sm text-ink truncate">{f.name}</span>
                        <span className="text-sm text-inkSoft shrink-0">{f.temp}°</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Quitar ${f.name}`}
                        onClick={() => removeFavorite(f)}
                        className="shrink-0 w-7 h-7 rounded-md text-inkSoft hover:text-red-300 hover:bg-surface/60 transition text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
