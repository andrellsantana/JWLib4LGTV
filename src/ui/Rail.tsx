import type { JSX } from 'preact';

export type Section = 'home' | 'categories';

const ICONS: Record<Section, JSX.Element> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  categories: (
    <g>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </g>
  ),
};
const LABELS: Record<Section, string> = { home: 'Início', categories: 'Categorias' };

export function Rail({ active, onGo }: { active: Section; onGo: (s: Section) => void }) {
  return (
    <nav class="rail" data-rail>
      <div class="logo">
        JW
        <br />
        Vídeos
        <small>LG TV</small>
      </div>
      {(Object.keys(LABELS) as Section[]).map((s) => (
        <div key={s} class={'nav' + (active === s ? ' on' : '')} data-f={`rail:${s}`} onClick={() => onGo(s)}>
          <svg viewBox="0 0 24 24">{ICONS[s]}</svg>
          {LABELS[s]}
        </div>
      ))}
    </nav>
  );
}
