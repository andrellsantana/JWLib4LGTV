import { useEffect, useState } from 'preact/hooks';
import { load, save } from './storage';

export type Quality = '240p' | '360p' | '480p' | '720p';
export type SubSize = 'p' | 'm' | 'g';
export type Background = 'img' | 'rand' | 'off';

export interface Settings {
  quality: Quality;
  subLang: string; // 'off' ou código de idioma do JW.org
  audioLang: string; // 'T' = português
  subSize: SubSize;
  bg: Background;
  seed: number;
}

export interface Progress {
  t: number; // segundos assistidos
  d: number; // duração
  at: number; // quando (ms)
}

export const LANGS: Array<[string, string]> = [
  ['T', 'Português'],
  ['E', 'Inglês'],
  ['S', 'Espanhol'],
  ['F', 'Francês'],
  ['LSB', 'Libras'],
];
export const langName = (code: string) => LANGS.find((l) => l[0] === code)?.[1] || code;

const DEFAULTS: Settings = { quality: '720p', subLang: 'off', audioLang: 'T', subSize: 'm', bg: 'img', seed: 0 };

let settings: Settings = { ...DEFAULTS, ...load<Partial<Settings>>('settings', {}) };
let favorites: string[] = load<string[]>('favorites', []);
let progress: Record<string, Progress> = load<Record<string, Progress>>('progress', {});
let lastPlayed: string | null = load<string | null>('lastPlayed', null);

const EVENT = 'jwlv-prefs';
function changed(key: string, value: unknown) {
  save(key, value);
  window.dispatchEvent(new Event(EVENT));
}

/** Re-renderiza o componente quando favoritos, progresso ou ajustes mudam. */
export function usePrefs(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => setV((x) => x + 1);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return v;
}

export const getSettings = () => settings;
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  settings = { ...settings, [key]: value };
  changed('settings', settings);
}

export const getFavorites = () => favorites;
export const isFavorite = (id: string) => favorites.indexOf(id) >= 0;
export function toggleFavorite(id: string): boolean {
  const on = !isFavorite(id);
  favorites = on ? [id].concat(favorites) : favorites.filter((x) => x !== id);
  changed('favorites', favorites);
  return on;
}

export const FINISHED = 0.95;

export function getProgress(id: string): Progress | undefined {
  return progress[id];
}
/** Vídeos em andamento, do mais recente para o mais antigo. */
export function inProgress(): string[] {
  return Object.keys(progress).sort((a, b) => progress[b].at - progress[a].at);
}
export function saveProgress(id: string, t: number, d: number) {
  if (!d) return;
  if (t / d >= FINISHED) delete progress[id];
  else if (t > 5) progress[id] = { t, d, at: Date.now() };
  else return;
  progress = { ...progress };
  lastPlayed = id;
  save('lastPlayed', id);
  changed('progress', progress);
}
export function clearProgress(id: string) {
  delete progress[id];
  progress = { ...progress };
  changed('progress', progress);
}
export const getLastPlayed = () => (lastPlayed && progress[lastPlayed] ? lastPlayed : null);

export function clearAll() {
  favorites = [];
  progress = {};
  lastPlayed = null;
  save('lastPlayed', null);
  save('favorites', favorites);
  changed('progress', progress);
}

/* ---------- cópia de segurança (RF17) ---------- */
export interface Snapshot {
  settings: Settings;
  favorites: string[];
  progress: Record<string, Progress>;
  lastPlayed: string | null;
}

export function exportData(): Snapshot {
  return { settings, favorites, progress, lastPlayed };
}

export function importData(s: Snapshot) {
  settings = { ...DEFAULTS, ...(s.settings || {}) };
  favorites = Array.isArray(s.favorites) ? s.favorites : [];
  progress = s.progress || {};
  lastPlayed = s.lastPlayed || null;
  save('settings', settings);
  save('favorites', favorites);
  save('lastPlayed', lastPlayed);
  changed('progress', progress);
}

/** Avisa a cada mudança (para a cópia automática). */
export function onPrefsChange(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
