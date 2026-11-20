/** Legendas WebVTT: leitura simples das falas e busca pelo tempo atual. */
export interface Cue {
  start: number;
  end: number;
  text: string;
}

function toSeconds(t: string): number {
  const p = t.trim().split(':').map(Number);
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
}

export function parseVtt(src: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = src.replace(/\r/g, '').split(/\n\n+/);
  for (const b of blocks) {
    const lines = b.split('\n');
    const i = lines.findIndex((l) => l.includes('-->'));
    if (i < 0) continue;
    const [a, z] = lines[i].split('-->');
    const text = lines
      .slice(i + 1)
      .join('\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (text) cues.push({ start: toSeconds(a), end: toSeconds(z.trim().split(/\s+/)[0]), text });
  }
  return cues;
}

/** Fala ativa em `t` (busca binária; as falas vêm em ordem). */
export function cueAt(cues: Cue[], t: number): string {
  let lo = 0;
  let hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const c = cues[mid];
    if (t < c.start) hi = mid - 1;
    else if (t >= c.end) lo = mid + 1;
    else return c.text;
  }
  return '';
}
