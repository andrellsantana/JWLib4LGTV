import type { Category, Subcategory, Video, VideoFile } from './types';

export const API = 'https://b.jw-cdn.org/apis/mediator/v1';
export const STUDIO_KEY = 'VODStudio';
export const MUSIC_KEY = 'VODMusicVideos';

/* Tipos mínimos da resposta da API (não documentada) do JW.org. */
interface RawFile {
  progressiveDownloadURL: string;
  label: string;
  frameHeight?: number;
  mimetype?: string;
  subtitles?: { url: string };
}
interface RawMedia {
  naturalKey: string;
  languageAgnosticNaturalKey?: string;
  title: string;
  description?: string;
  firstPublished?: string;
  duration?: number;
  durationFormattedHHMM?: string;
  images?: Record<string, Record<string, string>>;
  files?: RawFile[];
}
interface RawCategory {
  key: string;
  name: string;
  description?: string;
  media?: RawMedia[];
  subcategories?: RawCategory[];
}

function pickImage(images: RawMedia['images'], order: Array<[string, string]>): string {
  if (!images) return '';
  for (const [k, s] of order) {
    const url = images[k]?.[s];
    if (url) return url;
  }
  return '';
}

export function toVideo(m: RawMedia, cat: { key: string; name: string }, sub: string): Video {
  const files: VideoFile[] = (m.files || [])
    .filter((f) => f.mimetype === 'video/mp4' || /\.mp4$/i.test(f.progressiveDownloadURL))
    .map((f) => ({
      label: f.label,
      url: f.progressiveDownloadURL,
      subtitles: f.subtitles?.url,
      height: f.frameHeight || parseInt(f.label, 10) || 0,
    }))
    .sort((a, b) => a.height - b.height);
  return {
    id: m.naturalKey,
    langAgnosticId: m.languageAgnosticNaturalKey || m.naturalKey,
    title: m.title,
    description: m.description || '',
    published: m.firstPublished || '',
    duration: Math.round(m.duration || 0),
    durationText: m.durationFormattedHHMM || '',
    thumb: pickImage(m.images, [['wss', 'lg'], ['lss', 'lg'], ['wss', 'sm'], ['pnr', 'lg'], ['sqr', 'lg']]),
    image: pickImage(m.images, [['lsr', 'xl'], ['lss', 'lg'], ['wss', 'lg'], ['pnr', 'lg']]),
    files,
    category: cat.name,
    categoryKey: cat.key,
    subcategory: sub,
  };
}

export function toCategory(raw: RawCategory): Category {
  const subs: Subcategory[] = [];
  const cat = { key: raw.key, name: raw.name };
  for (const s of raw.subcategories || []) {
    const videos = (s.media || []).map((m) => toVideo(m, cat, s.name));
    if (videos.length) subs.push({ key: s.key, name: s.name, videos });
  }
  if (raw.media?.length) subs.unshift({ key: raw.key, name: raw.name, videos: raw.media.map((m) => toVideo(m, cat, raw.name)) });
  return { key: raw.key, name: raw.name, description: raw.description || '', subcategories: subs };
}

async function getJson(path: string, lang: string): Promise<{ category: RawCategory }> {
  const url = `${API}/categories/${lang}/${path}?detailed=1&clientType=www`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`);
  return res.json();
}

/** Lista as categorias de vídeo (chaves e nomes), na ordem do site. */
export async function fetchRootKeys(lang: string): Promise<Array<{ key: string; name: string }>> {
  const { category } = await getJson('VideoOnDemand', lang);
  return (category.subcategories || []).map((s) => ({ key: s.key, name: s.name }));
}

export async function fetchCategory(key: string, lang: string): Promise<Category> {
  const { category } = await getJson(key, lang);
  return toCategory(category);
}

export async function fetchLatest(lang: string): Promise<Video[]> {
  const { category } = await getJson('LatestVideos', lang);
  return (category.media || []).map((m) => toVideo(m, { key: 'LatestVideos', name: category.name }, category.name));
}
