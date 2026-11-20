import { useEffect, useRef, useState } from 'preact/hooks';
import type { Catalog } from '../api/types';
import { KEY } from '../nav/focus';
import { getProgress } from '../lib/prefs';
import { load, save } from '../lib/storage';
import { TvSchedule, type Pick } from '../lib/tvmode';
import { Player } from './Player';
import type { ComponentChildren } from 'preact';

const BANNER_MS = 6000;

/** Vídeos já tocados hoje no Modo TV (não repetem no mesmo dia). */
function seenToday(): Set<string> {
  const today = new Date().toISOString().slice(0, 10);
  const s = load<{ day: string; ids: string[] }>('tvSeen', { day: today, ids: [] });
  return new Set(s.day === today ? s.ids : []);
}
function remember(seen: Set<string>) {
  save('tvSeen', { day: new Date().toISOString().slice(0, 10), ids: Array.from(seen) });
}

interface Props {
  catalog: Catalog;
  notify: (m: string) => void;
  onExit: () => void;
  /** Chamado ao fim de cada vídeo; retorna false para parar (timer "ao fim do vídeo"). */
  onVideoEnd: () => boolean;
  extra?: ComponentChildren;
}

export function TvMode({ catalog, notify, onExit, onVideoEnd, extra }: Props) {
  const seen = useRef(seenToday());
  const sched = useRef<TvSchedule | null>(null);
  if (!sched.current) sched.current = new TvSchedule(catalog, seen.current, (id) => !!getProgress(id));
  const [now, setNow] = useState<Pick | null>(() => sched.current!.next());
  const [next, setNext] = useState<Pick | null>(() => sched.current!.next());
  const [banner, setBanner] = useState(true);

  useEffect(() => {
    remember(seen.current);
    setBanner(true);
    const id = window.setTimeout(() => setBanner(false), BANNER_MS);
    return () => window.clearTimeout(id);
  }, [now]);

  const advance = () => {
    setNow(next);
    setNext(sched.current!.next());
  };
  const channel = (delta: number) => {
    if (!now) return;
    sched.current!.changeChannel(now.video.categoryKey, delta);
    setNow(sched.current!.next());
    setNext(sched.current!.next());
  };

  if (!now) {
    notify('Não há vídeos disponíveis para o Modo TV');
    onExit();
    return null;
  }

  return (
    <Player
      key={now.video.id}
      video={now.video}
      startAt={0}
      notify={notify}
      startHidden
      extra={extra}
      onClose={onExit}
      onEnded={() => (onVideoEnd() ? advance() : onExit())}
      onHiddenKey={(k) => {
        if (k === KEY.UP || k === KEY.DOWN) channel(k === KEY.UP ? -1 : 1);
        else if (k === KEY.RIGHT) advance();
        else return false;
        return true;
      }}
      overlay={
        banner ? (
          <>
            <div class="tvbar">
              <span class="live">MODO TV</span>
              <div class="col now">
                <div class="lb">Agora · {now.why}</div>
                <div class="tt">{now.video.title}</div>
              </div>
              {next ? (
                <div class="col nxt">
                  <div class="lb">A seguir · {next.why}</div>
                  <div class="tt">{next.video.title}</div>
                </div>
              ) : null}
            </div>
            <div class="tvhelp">↑↓ trocar canal · → próximo vídeo · OK controles · Voltar sai</div>
          </>
        ) : null
      }
    />
  );
}
