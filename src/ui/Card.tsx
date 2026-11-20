import { useEffect, useRef, useState } from 'preact/hooks';
import type { Video } from '../api/types';
import { isNew } from '../lib/text';

/* Carrega a miniatura só quando o card chega perto da área visível (economiza rede e memória da TV). */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();
function watch(el: Element, cb: () => void) {
  if (typeof IntersectionObserver === 'undefined') return cb();
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            callbacks.get(e.target)?.();
            observer!.unobserve(e.target);
          }
        }
      },
      { rootMargin: '400px 1200px' },
    );
  }
  callbacks.set(el, cb);
  observer.observe(el);
}

interface Props {
  video: Video;
  fid: string;
  subtitle?: string;
  onOpen: (v: Video) => void;
}

export function Card({ video, fid, subtitle, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (ref.current) watch(ref.current, () => setShow(true));
  }, []);
  return (
    <div class="card" data-f={fid} ref={ref} onClick={() => onOpen(video)}>
      <div class="thumb">
        {show && video.thumb ? <img src={video.thumb} alt="" /> : null}
        {isNew(video) ? <div class="badge">NOVO</div> : null}
        {video.durationText ? <div class="dur">{video.durationText}</div> : null}
      </div>
      <div class="ct">{video.title}</div>
      <div class="cs">{subtitle ?? video.subcategory}</div>
    </div>
  );
}
