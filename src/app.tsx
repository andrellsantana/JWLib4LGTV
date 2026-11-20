import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { cachedCatalog, fetchCatalog } from './api/catalog';
import type { Catalog, Category, Video } from './api/types';
import { KEY, activate, focusFirst, focusById, focusedId, hover, move, restoreFocus } from './nav/focus';
import { Rail, type Section } from './ui/Rail';
import { Categories, CategoryPage, Detail, Home } from './ui/screens';

type Route =
  | { name: 'home' }
  | { name: 'categories' }
  | { name: 'category'; key: string }
  | { name: 'detail'; id: string };

type Status = 'loading' | 'ready' | 'error';

export function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [stack, setStack] = useState<Route[]>([{ name: 'home' }]);
  const [toast, setToast] = useState('');
  const [exitAsk, setExitAsk] = useState(false);
  const focusMemo = useRef<Record<number, string | null>>({});
  const route = stack[stack.length - 1];

  /* Catálogo: mostra o cache na hora e atualiza em segundo plano. */
  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchCatalog('T');
      setCatalog(fresh);
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
  const back = useCallback(() => {
    if (exitAsk) return setExitAsk(false);
    setStack((s) => {
      if (s.length > 1) return s.slice(0, -1);
      if (s[0].name !== 'home') return [{ name: 'home' }];
      setExitAsk(true);
      return s;
    });
  }, [exitAsk]);
  const go = useCallback((sec: Section) => {
    focusMemo.current = {};
    setStack([{ name: sec }]);
  }, []);

  /* Foco: ao mudar de tela, volta ao item onde estava (ou ao primeiro). */
  const depth = stack.length;
  useLayoutEffect(() => {
    const memo = focusMemo.current[depth - 1];
    if (!memo || !focusById(memo)) focusFirst();
  }, [depth, route.name, status, exitAsk]);
  useLayoutEffect(() => {
    restoreFocus();
  });

  /* Controle remoto e teclado. */
  useEffect(() => {
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
        case KEY.OK:
          activate();
          break;
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
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [back]);

  const openVideo = useCallback((v: Video) => push({ name: 'detail', id: v.id }), [push]);
  const play = useCallback((_v: Video) => notify('O player chega na próxima etapa'), [notify]);
  const pickCategory = useCallback((c: Category) => push({ name: 'category', key: c.key }), [push]);

  const findVideo = (id: string): Video | undefined => {
    if (!catalog) return undefined;
    for (const c of catalog.categories) for (const s of c.subcategories) for (const v of s.videos) if (v.id === id) return v;
    return catalog.latest.find((v) => v.id === id);
  };

  /* Tela de base (sob o detalhe, que é uma camada por cima). */
  const base = [...stack].reverse().find((r) => r.name !== 'detail') || { name: 'home' };
  const section: Section = stack[0].name === 'categories' ? 'categories' : 'home';
  const detail = route.name === 'detail' ? findVideo(route.id) : undefined;

  return (
    <div id="stage">
      <img class="fill bg-img" src="./bg.jpg" alt="" />
      <div class="fill scrim" />
      <Rail active={section} onGo={go} />
      <main class="screen">
        {status === 'loading' && !catalog ? <div class="status">Carregando vídeos do JW.org…</div> : null}
        {status === 'error' && !catalog ? (
          <div class="status">
            Não foi possível carregar os vídeos. Verifique a conexão da TV com a internet.
            <div>
              <button class="btn primary" data-f="retry" onClick={() => { setStatus('loading'); refresh(); }}>
                Tentar novamente
              </button>
            </div>
          </div>
        ) : null}
        {catalog && base.name === 'home' ? <Home catalog={catalog} onOpen={openVideo} onPlay={play} /> : null}
        {catalog && base.name === 'categories' ? <Categories catalog={catalog} onPick={pickCategory} /> : null}
        {catalog && base.name === 'category'
          ? (() => {
              const c = catalog.categories.find((x) => x.key === (base as { key: string }).key);
              return c ? <CategoryPage category={c} onOpen={openVideo} /> : null;
            })()
          : null}
      </main>
      {detail ? <Detail video={detail} onPlay={play} /> : null}
      {exitAsk ? (
        <div class="fill dialog-bg" data-layer>
          <div class="dialog">
            <h3>Sair do JW Vídeos?</h3>
            <div class="btns" style={{ marginTop: 0 }}>
              <button class="btn primary" data-f="exit:no" data-autofocus onClick={() => setExitAsk(false)}>
                Continuar
              </button>
              <button class="btn" data-f="exit:yes" onClick={() => window.close()}>
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {toast ? <div class="toast">{toast}</div> : null}
    </div>
  );
}
