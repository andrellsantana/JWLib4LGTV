import type { ComponentChildren } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { fetchMediaItem, pickFile } from '../api/mediator';
import type { Video } from '../api/types';
import { KEY, focusById, focusFirst } from '../nav/focus';
import { LANGS, getSettings, langName, saveProgress, setSetting, type Quality, type SubSize } from '../lib/prefs';
import { clock } from '../lib/text';
import { cueAt, parseVtt, type Cue } from '../lib/vtt';

type Menu = null | 'quality' | 'sub' | 'size' | 'lang';

interface Props {
  video: Video;
  startAt: number; // segundos
  onClose: () => void;
  onEnded: () => void;
  notify: (msg: string) => void;
  /** Botões extras na barra (ex.: timer, na etapa 3). */
  extra?: ComponentChildren;
}

const HIDE_AFTER = 5000;
const SEEK = 10;
const QUALITIES: Quality[] = ['720p', '480p', '360p', '240p'];
const SIZES: Array<[SubSize, string]> = [
  ['p', 'Pequeno'],
  ['m', 'Médio'],
  ['g', 'Grande'],
];

async function loadCues(url: string | undefined): Promise<Cue[] | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return parseVtt(await res.text());
  } catch {
    return null; // sem permissão de leitura (CORS) ou sem rede
  }
}

export function Player({ video, startAt, onClose, onEnded, notify, extra }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState<Video>(video); // versão no idioma escolhido
  const [lang, setLang] = useState(getSettings().audioLang);
  const [quality, setQuality] = useState<Quality>(getSettings().quality);
  const [subLang, setSubLang] = useState(getSettings().subLang);
  const [subSize, setSubSize] = useState<SubSize>(getSettings().subSize);
  const [cues, setCues] = useState<Cue[] | null>(null);
  const [t, setT] = useState(startAt);
  const [dur, setDur] = useState(video.duration);
  const [playing, setPlaying] = useState(true);
  const [controls, setControls] = useState(true);
  const [menu, setMenu] = useState<Menu>(null);
  const [error, setError] = useState('');
  const resumeAt = useRef(startAt);
  const ui = useRef({ controls: true, menu: null as Menu });
  ui.current = { controls, menu };
  const hideTimer = useRef(0);

  const file = pickFile(current, quality);

  /* Idioma do áudio: busca a versão do vídeo naquele idioma. */
  useEffect(() => {
    if (lang === 'T' && video.id.indexOf('_T_') > 0) {
      setCurrent(video);
      return;
    }
    let alive = true;
    fetchMediaItem(lang, video.langAgnosticId, video)
      .then((v) => {
        if (!alive) return;
        if (v && v.files.length) setCurrent(v);
        else {
          notify(`Este vídeo não está disponível em ${langName(lang)}`);
          setLang('T');
        }
      })
      .catch(() => notify('Sem conexão para trocar o idioma'));
    return () => {
      alive = false;
    };
  }, [lang, video, notify]);

  /* Legendas: do mesmo arquivo quando o idioma coincide; senão, da versão no idioma da legenda. */
  useEffect(() => {
    setCues(null);
    if (subLang === 'off') return;
    let alive = true;
    (async () => {
      let url: string | undefined;
      if (subLang === lang) url = pickFile(current, quality)?.subtitles;
      else {
        const other = await fetchMediaItem(subLang, video.langAgnosticId, video).catch(() => null);
        url = other ? pickFile(other, quality)?.subtitles : undefined;
      }
      const parsed = await loadCues(url);
      if (!alive) return;
      if (parsed) setCues(parsed);
      else notify(`Legenda em ${langName(subLang)} indisponível para este vídeo`);
    })();
    return () => {
      alive = false;
    };
  }, [subLang, lang, current, quality, video, notify]);

  /* Troca de arquivo (qualidade ou idioma) mantendo a posição. */
  useEffect(() => {
    const el = ref.current;
    if (!el || !file) return;
    const pos = el.currentTime > 0 ? el.currentTime : resumeAt.current;
    resumeAt.current = pos;
    el.src = file.url;
    el.load();
    const p = el.play();
    if (p && p.catch) p.catch(() => setPlaying(false));
  }, [file?.url]);

  const poke = useCallback(() => {
    setControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (ref.current && !ref.current.paused) {
        setControls(false);
        setMenu(null);
      }
    }, HIDE_AFTER);
  }, []);
  useEffect(() => {
    poke();
    return () => window.clearTimeout(hideTimer.current);
  }, [poke]);

  /* Progresso salvo a cada 5 s e ao sair. */
  useEffect(() => {
    const id = window.setInterval(() => {
      const el = ref.current;
      if (el && el.duration) saveProgress(video.id, el.currentTime, el.duration);
    }, 5000);
    return () => {
      window.clearInterval(id);
      const el = ref.current;
      if (el && el.duration) saveProgress(video.id, el.currentTime, el.duration);
    };
  }, [video.id]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) el.play();
    else el.pause();
  }, []);
  const seek = useCallback((d: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min((el.duration || 0) - 1, el.currentTime + d));
    setT(el.currentTime);
  }, []);

  /* Teclas do player: têm prioridade sobre a navegação geral. */
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.keyCode;
      const isBack = k === KEY.BACK_WEBOS || k === KEY.ESC || k === KEY.BACKSPACE;
      let handled = true;
      if (k === KEY.PLAY || k === KEY.PAUSE || k === KEY.PLAY_PAUSE) {
        toggle();
        poke();
      } else if (k === KEY.FF) seek(SEEK * 3);
      else if (k === KEY.REW) seek(-SEEK * 3);
      else if (k === KEY.STOP) onClose();
      else if (isBack) {
        if (ui.current.menu) {
          ui.current.menu = null;
          setMenu(null);
        } else if (ui.current.controls) {
          ui.current.controls = false;
          setControls(false);
        } else onClose();
      } else if (!ui.current.controls) {
        if (k === KEY.LEFT) seek(-SEEK);
        else if (k === KEY.RIGHT) seek(SEEK);
        poke();
      } else {
        handled = false; // setas/OK com a barra visível: navegação normal
        poke();
      }
      if (handled) {
        if (k === KEY.OK) swallowOk = true;
        ev.preventDefault();
        ev.stopImmediatePropagation();
      }
    };
    let swallowOk = false;
    const onKeyUp = (ev: KeyboardEvent) => {
      if (ev.keyCode === KEY.OK && swallowOk) {
        swallowOk = false;
        ev.stopImmediatePropagation();
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [poke, seek, toggle, onClose]);

  useEffect(() => {
    if (controls && !menu) {
      if (!focusById('pl:toggle')) focusFirst();
    } else if (menu) focusFirst();
  }, [controls, menu]);

  const choose = (fn: () => void) => () => {
    fn();
    setMenu(null);
    poke();
  };

  const subText = cues ? cueAt(cues, t) : '';

  return (
    <div class="fill player" data-layer>
      <video
        ref={ref}
        class="fill pv"
        onTimeUpdate={(e) => setT((e.target as HTMLVideoElement).currentTime)}
        onLoadedMetadata={(e) => {
          const el = e.target as HTMLVideoElement;
          setDur(el.duration);
          if (resumeAt.current > 0 && resumeAt.current < el.duration - 2) el.currentTime = resumeAt.current;
          setError('');
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          poke();
        }}
        onEnded={() => {
          saveProgress(video.id, dur, dur);
          onEnded();
        }}
        onError={() => setError('Não foi possível reproduzir este vídeo. Verifique a conexão e tente outra qualidade.')}
      />
      {subText ? (
        <div class={`subs s-${subSize}${controls ? ' up' : ''}`}>
          <span>{subText}</span>
        </div>
      ) : null}
      {error ? <div class="status">{error}</div> : null}
      <div class={'pctl' + (controls ? '' : ' hidden')}>
        <div class="ptitle">{current.title}</div>
        <div class="bar">
          <i style={{ width: `${dur ? (t / dur) * 100 : 0}%` }} />
        </div>
        <div class="times">
          <span>{clock(t)}</span>
          <span>{clock(dur)}</span>
        </div>
        {controls ? (
          <div class="pbtns">
            <button class="btn" data-f="pl:back" onClick={() => (seek(-SEEK), poke())}>
              ⟲ 10 s
            </button>
            <button class="btn primary" data-f="pl:toggle" onClick={() => (toggle(), poke())}>
              {playing ? '❚❚ Pausar' : '▶ Continuar'}
            </button>
            <button class="btn" data-f="pl:fwd" onClick={() => (seek(SEEK), poke())}>
              10 s ⟳
            </button>
            <span class="sp" />
            <button class="btn" data-f="pl:sub" onClick={() => setMenu('sub')}>
              Legendas: {subLang === 'off' ? 'Off' : langName(subLang)}
            </button>
            <button class="btn" data-f="pl:size" onClick={() => setMenu('size')}>
              Aa
            </button>
            <button class="btn" data-f="pl:quality" onClick={() => setMenu('quality')}>
              {file?.label || quality}
            </button>
            <button class="btn" data-f="pl:lang" onClick={() => setMenu('lang')}>
              {langName(lang)}
            </button>
            {extra}
          </div>
        ) : null}
      </div>
      {menu ? (
        <div class="fill menu-bg" data-layer>
          <div class="menu">
            {menu === 'quality' ? (
              <>
                <h3>Qualidade</h3>
                {QUALITIES.map((q) => (
                  <Opt key={q} id={`q:${q}`} on={file?.label === q} label={q === '720p' ? '720p (HD)' : q} onPick={choose(() => setQuality(q))} />
                ))}
              </>
            ) : null}
            {menu === 'sub' ? (
              <>
                <h3>Legendas</h3>
                <Opt id="s:off" on={subLang === 'off'} label="Desligadas" onPick={choose(() => (setSubLang('off'), setSetting('subLang', 'off')))} />
                {LANGS.filter((l) => l[0] !== 'LSB').map(([c, n]) => (
                  <Opt key={c} id={`s:${c}`} on={subLang === c} label={n} onPick={choose(() => (setSubLang(c), setSetting('subLang', c)))} />
                ))}
              </>
            ) : null}
            {menu === 'size' ? (
              <>
                <h3>Tamanho da legenda</h3>
                {SIZES.map(([s, n]) => (
                  <Opt key={s} id={`z:${s}`} on={subSize === s} label={n} onPick={choose(() => (setSubSize(s), setSetting('subSize', s)))} />
                ))}
              </>
            ) : null}
            {menu === 'lang' ? (
              <>
                <h3>Idioma do vídeo</h3>
                {LANGS.map(([c, n]) => (
                  <Opt key={c} id={`l:${c}`} on={lang === c} label={n} onPick={choose(() => setLang(c))} />
                ))}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Opt({ id, on, label, onPick }: { id: string; on: boolean; label: string; onPick: () => void }) {
  return (
    <div class="opt" data-f={id} data-autofocus={on ? '' : undefined} onClick={onPick}>
      <span class="ck">{on ? '✓' : ''}</span>
      {label}
    </div>
  );
}
