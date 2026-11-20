import type { Catalog, Video } from '../api/types';
import { MUSIC_KEY } from '../api/mediator';
import { isNew } from './text';

/** Regras do Modo TV (RF15). */
export const LONG_SECONDS = 30 * 60; // acima disso, é "programa longo"
export const MUSIC_EVERY = 4; // 1 a cada 4 vídeos é de Músicas
export const LONG_EVERY = 15; // 1 longo a cada 15 curtos

export interface Pick {
  video: Video;
  why: string; // rótulo da faixa "Agora": categoria, "Novidade", "programa longo"
}

export interface Channel {
  key: string;
  name: string;
  videos: Video[];
}

export class TvSchedule {
  private slot = 0;
  private shorts = 0;
  private ci = 0;
  private forced: number | null = null;
  readonly channels: Channel[];
  private fresh: Video[];

  constructor(
    catalog: Catalog,
    private seen: Set<string>, // já tocados hoje
    private watched: (id: string) => boolean = () => false, // em andamento ou já vistos
    private random: () => number = Math.random,
    now = new Date(),
  ) {
    this.channels = catalog.categories.map((c) => {
      const ids = new Set<string>();
      const videos: Video[] = [];
      for (const s of c.subcategories) for (const v of s.videos) if (!ids.has(v.id) && v.files.length) ids.add(v.id) && videos.push(v);
      return { key: c.key, name: c.name, videos };
    });
    const all = catalog.latest.concat(...this.channels.map((c) => c.videos));
    const ids = new Set<string>();
    this.fresh = all
      .filter((v) => isNew(v, now) && v.duration <= LONG_SECONDS && v.files.length && !ids.has(v.id) && ids.add(v.id))
      .sort((a, b) => (a.published < b.published ? 1 : -1));
  }

  private choose(list: Video[], long: boolean): Video | null {
    const fit = list.filter((v) => (v.duration > LONG_SECONDS) === long);
    let pool = fit.filter((v) => !this.seen.has(v.id));
    if (!pool.length) pool = fit;
    const unwatched = pool.filter((v) => !this.watched(v.id));
    if (unwatched.length) pool = unwatched;
    return pool.length ? pool[Math.floor(this.random() * pool.length)] : null;
  }

  /** Força o próximo vídeo a sair de outro canal (↑/↓ no controle). */
  changeChannel(currentKey: string, delta: number): void {
    const n = this.channels.length;
    const i = this.channels.findIndex((c) => c.key === currentKey);
    this.forced = (((i < 0 ? 0 : i) + delta) % n + n) % n;
  }

  next(): Pick | null {
    this.slot++;
    let pick: Pick | null = null;
    const ch = this.channels;
    if (this.forced !== null) {
      const c = ch[this.forced];
      this.forced = null;
      const v = this.choose(c.videos, false) || this.choose(c.videos, true);
      if (v) pick = { video: v, why: c.name };
    }
    const music = ch.find((c) => c.key === MUSIC_KEY);
    if (!pick && music && this.slot % MUSIC_EVERY === 0) {
      const v = this.choose(music.videos, false);
      if (v) pick = { video: v, why: music.name };
    }
    if (!pick && this.shorts >= LONG_EVERY) {
      for (let i = 0; i < ch.length && !pick; i++) {
        const c = ch[(this.ci + i) % ch.length];
        const v = this.choose(c.videos, true);
        if (v) pick = { video: v, why: `${c.name} · programa longo` };
      }
      if (pick) this.shorts = 0;
    }
    if (!pick && this.slot % 2 === 1) {
      const v = this.fresh.find((x) => !this.seen.has(x.id));
      if (v) pick = { video: v, why: 'Novidade' };
    }
    for (let i = 0; i < ch.length && !pick; i++) {
      const c = ch[this.ci % ch.length];
      this.ci++;
      if (c.key === MUSIC_KEY) continue;
      const v = this.choose(c.videos, false);
      if (v) pick = { video: v, why: c.name };
    }
    if (pick) {
      if (pick.video.duration <= LONG_SECONDS) this.shorts++;
      this.seen.add(pick.video.id);
    }
    return pick;
  }
}
