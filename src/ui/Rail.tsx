import type { JSX } from 'preact';

export type Section = 'home' | 'categories' | 'favorites' | 'settings';

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
  favorites: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  settings: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </g>
  ),
};
const LABELS: Record<Section, string> = { home: 'Início', categories: 'Categorias', favorites: 'Minha lista', settings: 'Ajustes' };

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
