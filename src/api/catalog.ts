import { fetchCategory, fetchLatest, fetchRootKeys, STUDIO_KEY } from './mediator';
import type { Catalog, Category, Video } from './types';
import { idbGet, idbSet } from '../lib/idb';

const CACHE_KEY = 'catalog.v1';
const SKIP = new Set(['VODAudioDescriptions']); // fora do escopo (audiodescrições)

/** Executa tarefas assíncronas com no máximo `n` em paralelo (a TV tem pouca CPU e rede). */
async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function cachedCatalog(): Promise<Catalog | null> {
  return (await idbGet<Catalog>(CACHE_KEY)) || null;
}

/** Busca o catálogo completo no JW.org e grava em cache. "De Nosso Estúdio" vem sempre primeiro. */
export async function fetchCatalog(lang = 'T'): Promise<Catalog> {
  const roots = (await fetchRootKeys(lang)).filter((r) => !SKIP.has(r.key));
  roots.sort((a, b) => (a.key === STUDIO_KEY ? -1 : b.key === STUDIO_KEY ? 1 : 0));
  const [latest, categories] = await Promise.all([
    fetchLatest(lang).catch(() => [] as Video[]),
    pool(roots, 4, (r) => fetchCategory(r.key, lang).catch(() => null as Category | null)),
  ]);
  const catalog: Catalog = {
    fetchedAt: new Date().toISOString(),
    language: lang,
    latest,
    categories: categories.filter((c): c is Category => !!c && c.subcategories.length > 0),
  };
  await idbSet(CACHE_KEY, catalog);
  return catalog;
}

/** Índice id → vídeo. Um vídeo pode estar em várias categorias; vale a primeira ocorrência por categoria real. */
export function indexVideos(c: Catalog): Map<string, Video> {
  const map = new Map<string, Video>();
  for (const cat of c.categories) for (const s of cat.subcategories) for (const v of s.videos) if (!map.has(v.id)) map.set(v.id, v);
  for (const v of c.latest) if (!map.has(v.id)) map.set(v.id, v);
  return map;
}
