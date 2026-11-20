import { describe, expect, it } from 'vitest';
import { TvSchedule } from '../src/lib/tvmode';
import type { Catalog, Video } from '../src/api/types';

const now = new Date('2026-11-20T12:00:00Z');
let n = 0;
function vid(cat: string, duration: number, published = '2025-01-01'): Video {
  n++;
  return { id: `${cat}-${n}`, title: `${cat} ${n}`, duration, published, files: [{ label: '720p', url: 'x', height: 720 }], category: cat, categoryKey: cat } as Video;
}
function cat(key: string, count: number, dur = 300, longs = 0) {
  const videos = Array.from({ length: count }, () => vid(key, dur)).concat(Array.from({ length: longs }, () => vid(key, 3600)));
  return { key, name: key, description: '', subcategories: [{ key, name: key, videos }] };
}
const catalog: Catalog = {
  fetchedAt: '',
  language: 'T',
  latest: [vid('VODStudio', 600, '2026-11-18'), vid('VODStudio', 600, '2026-11-10')],
  categories: [cat('VODStudio', 30, 600, 5), cat('VODChildren', 30), cat('VODMusicVideos', 30, 200), cat('VODFamily', 30)],
};

describe('Modo TV', () => {
  const s = new TvSchedule(catalog, new Set(), () => false, () => 0.5, now);
  const seq = Array.from({ length: 40 }, () => s.next()!);
  it('1 a cada 4 é de Músicas', () => {
    seq.forEach((p, i) => {
      if ((i + 1) % 4 === 0) expect(p.video.categoryKey).toBe('VODMusicVideos');
    });
  });
  it('um longo depois de 15 curtos', () => {
    const firstLong = seq.findIndex((p) => p.video.duration > 1800);
    expect(firstLong).toBeGreaterThanOrEqual(15);
    expect(firstLong).toBeLessThanOrEqual(17);
  });
  it('novidades entram primeiro', () => expect(seq[0].why).toBe('Novidade'));
  it('não repete no mesmo dia', () => expect(new Set(seq.map((p) => p.video.id)).size).toBe(seq.length));
  it('troca de canal', () => {
    const t = new TvSchedule(catalog, new Set(), () => false, () => 0.1, now);
    t.changeChannel('VODStudio', 1);
    expect(t.next()!.video.categoryKey).toBe('VODChildren');
  });
});
