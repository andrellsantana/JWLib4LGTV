/** Previsão do tempo do Rio de Janeiro pelo Open-Meteo (gratuito, sem chave). */
export const RIO = { lat: -22.9068, lon: -43.1729 };

export interface Weather {
  now: { temp: number; code: number };
  days: Array<{ date: string; code: number; max: number; min: number }>;
  fetchedAt: number;
}

export function weatherUrl(): string {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${RIO.lat}&longitude=${RIO.lon}` +
    '&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min' +
    '&timezone=America%2FSao_Paulo&forecast_days=4'
  );
}

interface Raw {
  current: { temperature_2m: number; weather_code: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
}

export function parseWeather(r: Raw, at = Date.now()): Weather {
  const d = r.daily;
  return {
    now: { temp: Math.round(r.current.temperature_2m), code: r.current.weather_code },
    days: d.time.slice(1, 4).map((date, i) => ({
      date,
      code: d.weather_code[i + 1],
      max: Math.round(d.temperature_2m_max[i + 1]),
      min: Math.round(d.temperature_2m_min[i + 1]),
    })),
    fetchedAt: at,
  };
}

let cache: Weather | null = null;
const MAX_AGE = 30 * 60 * 1000;

export async function getWeather(): Promise<Weather | null> {
  if (cache && Date.now() - cache.fetchedAt < MAX_AGE) return cache;
  try {
    const res = await fetch(weatherUrl());
    if (!res.ok) return cache;
    cache = parseWeather((await res.json()) as Raw);
  } catch {
    /* sem rede: mantém a última previsão */
  }
  return cache;
}

/** Códigos WMO → descrição e símbolo. */
export function describe(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Céu limpo', icon: '☀️' };
  if (code <= 2) return { text: 'Parcialmente nublado', icon: '⛅' };
  if (code === 3) return { text: 'Nublado', icon: '☁️' };
  if (code <= 48) return { text: 'Neblina', icon: '🌫️' };
  if (code <= 57) return { text: 'Garoa', icon: '🌦️' };
  if (code <= 67) return { text: 'Chuva', icon: '🌧️' };
  if (code <= 77) return { text: 'Neve', icon: '❄️' };
  if (code <= 82) return { text: 'Pancadas de chuva', icon: '🌧️' };
  return { text: 'Tempestade', icon: '⛈️' };
}
