import { useMemo, useState } from 'preact/hooks';
import type { Video } from '../api/types';
import { normalize } from '../lib/text';
import { Card } from './Card';

const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
const MAX_RESULTS = 60;

/** Busca local por título e descrição, sem diferenciar acentos (RF09). */
export function searchVideos(all: Video[], q: string): Video[] {
  const words = normalize(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const out: Video[] = [];
  for (const v of all) {
    const hay = normalize(v.title + ' ' + v.description);
    if (words.every((w) => hay.indexOf(w) >= 0)) out.push(v);
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

export function Search({ videos, onOpen }: { videos: Video[]; onOpen: (v: Video) => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => searchVideos(videos, q), [videos, q]);
  const type = (k: string) => setQ((s) => (k === 'DEL' ? s.slice(0, -1) : k === 'CLR' ? '' : s + k.toLowerCase()));
  return (
    <div class="scroller page" data-scroller>
      <h1>Busca</h1>
      <div class="sbox">{q ? q : <span class="ph">Digite com as setas e OK…</span>}</div>
      <div class="slayout">
        <div class="kb" data-block>
          {KEYS.map((k) => (
            <div key={k} class="key" data-f={`kb:${k}`} onClick={() => type(k)}>
              {k}
            </div>
          ))}
          <div class="key wide" data-f="kb:space" onClick={() => type(' ')}>
            Espaço
          </div>
          <div class="key wide" data-f="kb:del" onClick={() => type('DEL')}>
            Apagar
          </div>
          <div class="key wide" data-f="kb:clr" onClick={() => type('CLR')}>
            Limpar
          </div>
        </div>
        <div class="sres">
          <p class="note">
            {q ? `${results.length >= MAX_RESULTS ? 'Mais de ' + MAX_RESULTS : results.length} resultado(s) para “${q}”` : `Busca nos títulos de ${videos.length} vídeos`}
          </p>
          <div class="grid g3">
            {results.map((v) => (
              <Card key={v.id} video={v} fid={`sr:${v.id}`} subtitle={v.category} onOpen={onOpen} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
