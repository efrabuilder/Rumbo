"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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
};

const COUNTRY_TO_CURRENCY = {
  JP: "JPY", US: "USD", GB: "GBP", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR",
  PT: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  MX: "MXN", CA: "CAD", AU: "AUD", NZ: "NZD", CH: "CHF", CN: "CNY", SE: "SEK",
  SG: "SGD", HK: "HKD", NO: "NOK", KR: "KRW", TR: "TRY", IN: "INR", BR: "BRL",
  ZA: "ZAR", DK: "DKK", PL: "PLN", TH: "THB", ID: "IDR", CZ: "CZK", IL: "ILS",
  PH: "PHP", MY: "MYR", RO: "RON",
};

const NAV_ITEMS = [
  { id: "resumen", label: "Resumen" },
  { id: "guardados", label: "Guardados" },
  { id: "convertir", label: "Convertir" },
];

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

export default function Home() {
  const [query, setQuery] = useState("");
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

  const searchCity = useCallback(async (text) => {
    if (!text.trim()) return;
    setWeatherError("");
    setLoadingWeather(true);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=1&language=es&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setWeatherError("No encontramos esa ciudad. Probá con otro nombre.");
        setLoadingWeather(false);
        return;
      }
      const g = geoData.results[0];
      const dest = {
        name: g.name,
        country: g.country,
        countryCode: g.country_code,
        lat: g.latitude,
        lon: g.longitude,
        timezone: g.timezone,
      };
      setDestination(dest);

      const currency = COUNTRY_TO_CURRENCY[g.country_code] || "USD";
      if (CURRENCY_INFO[currency]) {
        setToCur(currency);
        setFromCur(currency === "USD" ? "EUR" : "USD");
      }

      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}` +
          `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day` +
          `&hourly=temperature_2m,weather_code` +
          `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
          `&forecast_days=7&timezone=${encodeURIComponent(g.timezone)}`
      );
      const wData = await wRes.json();
      setWeather(wData);
      setUpdatedAt(new Date());

      setFavorites((prev) => {
        const withoutDup = prev.filter((f) => !(f.name === dest.name && f.country === dest.country));
        return [{ ...dest, temp: Math.round(wData?.current?.temperature_2m ?? 0) }, ...withoutDup].slice(0, 6);
      });
    } catch (e) {
      setWeatherError("No se pudo conectar con el servicio de clima. Revisá tu conexión e intentá otra vez.");
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    searchCity("Lisbon");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function getRate() {
      setLoadingRate(true);
      setRateError("");
      try {
        const res = await fetch(
          `https://api.frankfurter.app/latest?amount=${amount || 0}&from=${fromCur}&to=${toCur}`
        );
        const data = await res.json();
        if (!cancelled) setRateData(data);
      } catch (e) {
        if (!cancelled) setRateError("No se pudo obtener la tasa de cambio.");
      } finally {
        if (!cancelled) setLoadingRate(false);
      }
    }
    if (fromCur !== toCur) {
      getRate();
    } else {
      setRateData({ rates: { [toCur]: Number(amount) || 0 }, date: null });
    }
    return () => {
      cancelled = true;
    };
  }, [amount, fromCur, toCur]);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchCity(query);
    setQuery("");
  };

  const swapCurrencies = () => {
    setFromCur(toCur);
    setToCur(fromCur);
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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-line bg-surface px-5 py-6 flex md:flex-col gap-6 md:gap-8">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Rumbo</h1>
          <p className="text-inkSoft text-xs mt-1 hidden md:block">Clima y moneda para tu próximo viaje</p>
        </div>

        <nav className="flex md:flex-col gap-1 md:gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActiveNav(item.id)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                activeNav === item.id
                  ? "bg-surface2 text-ink"
                  : "text-inkSoft hover:text-ink hover:bg-surface2/60"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div id="guardados" className="hidden md:block flex-1 overflow-y-auto">
          <p className="text-xs text-inkSoft mb-2">Destinos guardados</p>
          <div className="flex flex-col gap-1">
            {favorites.map((f) => (
              <button
                key={f.name + f.country}
                onClick={() => searchCity(f.name)}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-surface2/60 text-left"
              >
                <span className="text-sm text-ink truncate">{f.name}</span>
                <span className="text-sm text-inkSoft">{f.temp}°</span>
              </button>
            ))}
            {favorites.length === 0 && (
              <p className="text-xs text-inkSoft/70">Tus búsquedas van a aparecer acá.</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full" id="resumen">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ciudad o aeropuerto"
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
        </div>

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
                    <p className="text-inkSoft text-sm">{destination.country}</p>
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
                      {new Date().toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: destination.timezone,
                      })}
                    </p>
                  </div>
                </div>
              </div>
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

              {/* Currency converter, integrated as a dashboard card */}
              <div id="convertir" className="bg-surface border border-line rounded-xl2 p-5">
                <p className="text-xs text-inkSoft mb-3">
                  Convertir a moneda de {destination.country}
                </p>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-surface2 border border-line rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber/60"
                />
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
          </>
        )}
      </main>
    </div>
  );
}
