import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { cachedCatalog, fetchCatalog, indexVideos } from './api/catalog';
import type { Catalog, Category, Video } from './api/types';
import { KEY, activate, focusFirst, focusById, focusedId, hover, move, restoreFocus } from './nav/focus';
import {
  clearProgress,
  getLastPlayed,
  getProgress,
  getSettings,
  isFavorite,
  toggleFavorite,
  usePrefs,
} from './lib/prefs';
import { Background } from './ui/Background';
import { Rail, type Section } from './ui/Rail';
import { Categories, CategoryPage, Detail, Home } from './ui/screens';
import { Favorites, Settings } from './ui/pages';
import { Player } from './ui/Player';

type Route =
  | { name: Section }
  | { name: 'category'; key: string }
  | { name: 'detail'; id: string }
  | { name: 'player'; id: string; from: number };

type Status = 'loading' | 'ready' | 'error';
type Dialog = null | { kind: 'exit' } | { kind: 'welcome'; id: string } | { kind: 'options'; id: string };

const LONG_PRESS_MS = 600;

export function App() {
  usePrefs();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [toast, setToast] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const focusMemo = useRef<Record<number, string | null>>({});
  const welcomed = useRef(false);
  const route = stack[stack.length - 1];

  /* Catálogo: mostra o cache na hora e atualiza em segundo plano. */
  const refresh = useCallback(async () => {
    try {
      setCatalog(await fetchCatalog('T'));
      setStatus('ready');
    } catch {
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, []);
  useEffect(() => {
    cachedCatalog().then((c) => {
      if (c) {
        setCatalog(c);
        setStatus('ready');
      }
      refresh();
    });
  }, [refresh]);

  const index = useMemo(() => (catalog ? indexVideos(catalog) : new Map<string, Video>()), [catalog]);
  const find = useCallback((id: string) => index.get(id), [index]);

  /* Ao abrir: oferece continuar o último vídeo interrompido. */
  useEffect(() => {
    if (!catalog || welcomed.current) return;
    welcomed.current = true;
    const last = getLastPlayed();
    if (last && index.has(last)) setDialog({ kind: 'welcome', id: last });
  }, [catalog, index]);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const push = useCallback((r: Route) => {
    setStack((s) => {
      focusMemo.current[s.length - 1] = focusedId();
      return s.concat(r);
    });
  }, []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const back = useCallback(() => {
    if (dialog) return setDialog(null);
    setStack((s) => {
      if (s.length > 1) return s.slice(0, -1);
      if (s[0].name !== 'home') return [{ name: 'home' }];
      setDialog({ kind: 'exit' });
      return s;
    });
  }, [dialog]);
  const go = useCallback((sec: Section) => {
    focusMemo.current = {};
    setStack([{ name: sec }]);
  }, []);

  /* Foco: ao mudar de tela, volta ao item onde estava (ou ao primeiro). */
  const depth = stack.length;
  useLayoutEffect(() => {
    const memo = focusMemo.current[depth - 1];
    if (!memo || !focusById(memo)) focusFirst();
  }, [depth, route.name, status, dialog]);
  useLayoutEffect(() => {
    restoreFocus();
  });

  /* Controle remoto, teclado, Magic Remote e rodinha. */
  useEffect(() => {
    let okDownAt = 0;
    let longDone = false;
    const onKey = (ev: KeyboardEvent) => {
      switch (ev.keyCode) {
        case KEY.LEFT:
          move('L');
          break;
        case KEY.RIGHT:
          move('R');
          break;
        case KEY.UP:
          move('U');
          break;
        case KEY.DOWN:
          move('D');
          break;
        case KEY.OK: {
          // OK segurado sobre um card abre as opções (favoritar, remover).
          if (!ev.repeat) {
            okDownAt = Date.now();
            longDone = false;
          } else if (!longDone && Date.now() - okDownAt > LONG_PRESS_MS) {
            const id = (document.querySelector('.focus') as HTMLElement | null)?.getAttribute('data-video');
            if (id) {
              longDone = true;
              setDialog({ kind: 'options', id });
            }
          }
          break;
        }
        case KEY.BACK_WEBOS:
        case KEY.ESC:
        case KEY.BACKSPACE:
          back();
          break;
        default:
          return;
      }
      ev.preventDefault();
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.keyCode !== KEY.OK) return;
      if (!longDone) activate();
      longDone = false;
    };
    let wheelAt = 0;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const now = Date.now();
      if (now - wheelAt < 200 || Math.abs(ev.deltaX) + Math.abs(ev.deltaY) < 4) return;
      wheelAt = now;
      if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) move(ev.deltaX > 0 ? 'R' : 'L');
      else move(ev.deltaY > 0 ? 'D' : 'U');
    };
    const onMouse = (ev: MouseEvent) => hover(ev.target);
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [back]);

  const openVideo = useCallback((v: Video) => push({ name: 'detail', id: v.id }), [push]);
  const play = useCallback(
    (v: Video, fromStart?: boolean) => {
      const p = getProgress(v.id);
      push({ name: 'player', id: v.id, from: !fromStart && p ? p.t : 0 });
    },
    [push],
  );
  const favorite = useCallback((v: Video) => notify(toggleFavorite(v.id) ? 'Adicionado aos favoritos' : 'Removido dos favoritos'), [notify]);
  const forget = useCallback(
    (v: Video) => {
      clearProgress(v.id);
      notify('Removido de Continuar assistindo');
    },
    [notify],
  );
  const pickCategory = useCallback((c: Category) => push({ name: 'category', key: c.key }), [push]);

  /* Tela de base (detalhe e player são camadas por cima). */
  const base = [...stack].reverse().find((r) => r.name !== 'detail' && r.name !== 'player') || { name: 'home' };
  const section = stack[0].name as Section;
  const detailRoute = [...stack].reverse().find((r) => r.name === 'detail') as { id: string } | undefined;
  const detail = detailRoute && route.name !== 'player' ? find(detailRoute.id) : undefined;
  const playing = route.name === 'player' ? find(route.id) : undefined;
  const settings = getSettings();

  return (
    <div id="stage">
      <Background mode={settings.bg} seed={settings.seed} />
      <Rail active={section} onGo={go} />
      <main class="screen">
        {status === 'loading' && !catalog ? <div class="status">Carregando vídeos do JW.org…</div> : null}
        {status === 'error' && !catalog ? (
          <div class="status">
            Não foi possível carregar os vídeos. Verifique a conexão da TV com a internet.
            <div>
              <button class="btn primary" data-f="retry" onClick={() => (setStatus('loading'), refresh())}>
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}
        {catalog && base.name === 'home' ? <Home catalog={catalog} find={find} onOpen={openVideo} onPlay={(v) => play(v)} /> : null}
        {catalog && base.name === 'categories' ? <Categories catalog={catalog} onPick={pickCategory} /> : null}
        {catalog && base.name === 'category'
          ? (() => {
              const c = catalog.categories.find((x) => x.key === (base as { key: string }).key);
              return c ? <CategoryPage category={c} onOpen={openVideo} /> : null;
            })()
          : null}
        {catalog && base.name === 'favorites' ? <Favorites find={find} onOpen={openVideo} /> : null}
        {base.name === 'settings' ? <Settings notify={notify} /> : null}
      </main>
      {detail ? <Detail video={detail} onPlay={play} onFavorite={favorite} onForget={forget} /> : null}
      {playing && route.name === 'player' ? (
        <Player key={route.id + route.from} video={playing} startAt={route.from} notify={notify} onClose={pop} onEnded={pop} />
      ) : null}
      {dialog ? (
        <div class="fill dialog-bg" data-layer>
          <div class="dialog">{renderDialog(dialog)}</div>
        </div>
      ) : null}
      {toast ? <div class="toast">{toast}</div> : null}
    </div>
  );

  function renderDialog(d: NonNullable<Dialog>) {
    if (d.kind === 'exit') {
      return (
        <>
          <h3>Sair do JW Vídeos?</h3>
          <div class="opt" data-f="exit:no" data-autofocus onClick={() => setDialog(null)}>
            <span class="ck" />
            Continuar no app
          </div>
          <div class="opt" data-f="exit:yes" onClick={() => window.close()}>
            <span class="ck" />
            Sair
          </div>
        </>
      );
    }
    const v = find(d.id);
    if (!v) return null;
    if (d.kind === 'welcome') {
      const p = getProgress(v.id);
      return (
        <>
          <h3>Bem-vindo de volta</h3>
          <div class="opt" data-f="wl:resume" data-autofocus onClick={() => (setDialog(null), play(v))}>
            <span class="ck">▶</span>
            Continuar “{v.title}”{p ? ` de ${Math.round((p.t / p.d) * 100)}%` : ''}
          </div>
          <div class="opt" data-f="wl:close" onClick={() => setDialog(null)}>
            <span class="ck" />
            Agora não
          </div>
        </>
      );
    }
    return (
      <>
        <h3>{v.title}</h3>
        <div class="opt" data-f="op:open" data-autofocus onClick={() => (setDialog(null), openVideo(v))}>
          <span class="ck" />
          Ver detalhes
        </div>
        <div class="opt" data-f="op:fav" onClick={() => (setDialog(null), favorite(v))}>
          <span class="ck" />
          {isFavorite(v.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        </div>
        {getProgress(v.id) ? (
          <div class="opt" data-f="op:forget" onClick={() => (setDialog(null), forget(v))}>
            <span class="ck" />
            Tirar de Continuar assistindo
          </div>
        ) : null}
      </>
    );
  }
}
