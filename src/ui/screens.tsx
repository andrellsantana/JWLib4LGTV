import type { Catalog, Category, Video } from '../api/types';
import { STUDIO_KEY } from '../api/mediator';
import { formatDate, newest } from '../lib/text';
import { getFavorites, getProgress, inProgress, isFavorite } from '../lib/prefs';
import { listOf } from './pages';
import { Card } from './Card';
import { Row } from './Row';

type Open = (v: Video) => void;

export function Home({ catalog, onOpen, onPlay, find }: { catalog: Catalog; onOpen: Open; onPlay: Open; find: (id: string) => Video | undefined }) {
  const all = catalog.categories.flatMap((c) => c.subcategories.flatMap((s) => s.videos));
  const fresh = newest(catalog.latest.concat(all));
  const top = fresh[0] || catalog.latest[0] || all[0];
  const studio = catalog.categories.find((c) => c.key === STUDIO_KEY);
  const others = catalog.categories.filter((c) => c.key !== STUDIO_KEY);
  return (
    <div class="scroller" data-scroller>
      {top ? (
        <div class="hero" data-block data-hero>
          <div class="eyebrow">{fresh[0] ? `Novo · publicado em ${formatDate(top.published)}` : top.category}</div>
          <h1>{top.title}</h1>
          <div class="meta">
            <span>{top.durationText}</span>
            <span>{top.category}</span>
          </div>
          <div class="btns">
            <button class="btn primary" data-f="hero:play" data-autofocus onClick={() => onPlay(top)}>
              ▶ Assistir
            </button>
            <button class="btn" data-f="hero:detail" onClick={() => onOpen(top)}>
              Detalhes
            </button>
          </div>
        </div>
      ) : null}
      <Row id="new" title="Novidades" extra="últimos 30 dias" videos={fresh.slice(0, 30)} onOpen={onOpen} />
      {studio?.subcategories.map((s) => (
        <Row key={s.key} id={`st:${s.key}`} title={`De Nosso Estúdio · ${s.name}`} extra={`${s.videos.length} vídeos`} videos={s.videos.slice(0, 30)} studio onOpen={onOpen} />
      ))}
      <Row id="cont" title="Continuar assistindo" videos={listOf(inProgress(), find)} onOpen={onOpen} />
      <Row id="fav" title="Favoritos" videos={listOf(getFavorites(), find)} onOpen={onOpen} />
      {others.map((c) => {
        const s = c.subcategories[0];
        return <Row key={c.key} id={`cat:${c.key}`} title={c.name} extra={s.name !== c.name ? s.name : undefined} videos={s.videos.slice(0, 30)} onOpen={onOpen} />;
      })}
    </div>
  );
}

export function Categories({ catalog, onPick }: { catalog: Catalog; onPick: (c: Category) => void }) {
  return (
    <div class="scroller page" data-scroller>
      <h1>Categorias</h1>
      <div class="grid">
        {catalog.categories.map((c) => {
          const first = c.subcategories[0]?.videos[0];
          const total = c.subcategories.reduce((n, s) => n + s.videos.length, 0);
          return (
            <div class="card" key={c.key} data-f={`catg:${c.key}`} data-block onClick={() => onPick(c)}>
              <div class="thumb">
                {first?.thumb ? <img src={first.thumb} alt="" /> : null}
                {c.key === STUDIO_KEY ? <div class="badge blue">DESTAQUE</div> : null}
              </div>
              <div class="ct">{c.name}</div>
              <div class="cs">
                {c.subcategories.length} seções · {total} vídeos
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CategoryPage({ category, onOpen }: { category: Category; onOpen: Open }) {
  return (
    <div class="scroller page" data-scroller>
      <h1>{category.name}</h1>
      {category.description ? <p class="lead">{category.description}</p> : null}
      {category.subcategories.map((s) => (
        <Row key={s.key} id={`sub:${s.key}`} title={s.name} extra={`${s.videos.length} vídeos`} videos={s.videos} studio={category.key === STUDIO_KEY} onOpen={onOpen} />
      ))}
    </div>
  );
}

export function Detail({ video, onPlay, onFavorite, onForget }: { video: Video; onPlay: (v: Video, fromStart?: boolean) => void; onFavorite: Open; onForget: Open }) {
  const pr = getProgress(video.id);
  const fav = isFavorite(video.id);
  return (
    <div class="fill detail" data-layer>
      {video.image ? <img class="detail-art" src={video.image} alt="" /> : null}
      <div class="content">
        <div class="eyebrow">{video.category}</div>
        <h1>{video.title}</h1>
        <div class="meta">
          <span>{video.durationText}</span>
          {video.published ? <span>Publicado em {formatDate(video.published)}</span> : null}
          <span>{video.subcategory}</span>
        </div>
        {video.description ? <p>{video.description}</p> : null}
        <div class="btns">
          {pr ? (
            <>
              <button class="btn primary" data-f="detail:resume" data-autofocus onClick={() => onPlay(video)}>
                ▶ Continuar de {Math.round((pr.t / pr.d) * 100)}%
              </button>
              <button class="btn" data-f="detail:start" onClick={() => onPlay(video, true)}>
                Do início
              </button>
            </>
          ) : (
            <button class="btn primary" data-f="detail:play" data-autofocus onClick={() => onPlay(video, true)}>
              ▶ Assistir
            </button>
          )}
          <button class="btn" data-f="detail:fav" onClick={() => onFavorite(video)}>
            {fav ? '♥ Remover dos favoritos' : '♡ Favoritar'}
          </button>
          {pr ? (
            <button class="btn" data-f="detail:forget" onClick={() => onForget(video)}>
              Tirar de Continuar assistindo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { Card };
