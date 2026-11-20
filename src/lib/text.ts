import type { Video } from '../api/types';

export const NEW_DAYS = 30;

export function isNew(v: Pick<Video, 'published'>, now = new Date()): boolean {
  if (!v.published) return false;
  const age = (now.getTime() - new Date(v.published).getTime()) / 864e5;
  return age >= 0 && age <= NEW_DAYS;
}

/** Remove acentos e caixa: "Jeová" → "jeova". */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const z = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${z}` : `${m}:${z}`;
}

/** Novidades: últimos 30 dias, mais recentes primeiro, sem repetir. */
export function newest(videos: Video[], now = new Date()): Video[] {
  const seen = new Set<string>();
  return videos
    .filter((v) => isNew(v, now) && !seen.has(v.id) && seen.add(v.id))
    .sort((a, b) => (a.published < b.published ? 1 : -1));
}
