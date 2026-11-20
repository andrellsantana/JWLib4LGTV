/**
 * Navegação espacial para controle remoto.
 *
 * Todo elemento navegável tem o atributo `data-f` com um id estável. As setas
 * escolhem o vizinho mais próximo na direção; OK dispara `click()`. Uma camada
 * aberta (`data-layer`, ex.: menu ou diálogo) restringe a navegação a ela.
 * O trilho lateral (`data-rail`) só é alcançado pela seta para a esquerda.
 */

export const KEY = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  OK: 13,
  BACK_WEBOS: 461,
  ESC: 27,
  BACKSPACE: 8,
  PLAY: 415,
  PAUSE: 19,
  PLAY_PAUSE: 10252,
  STOP: 413,
  FF: 417,
  REW: 412,
} as const;

export type Dir = 'L' | 'R' | 'U' | 'D';

let current: HTMLElement | null = null;
let currentId: string | null = null;

function scope(): ParentNode {
  const layers = document.querySelectorAll<HTMLElement>('[data-layer]');
  return layers.length ? layers[layers.length - 1] : document;
}

export function focusables(): HTMLElement[] {
  return Array.from(scope().querySelectorAll<HTMLElement>('[data-f]')).filter((e) => e.offsetParent !== null);
}

export function focusedId(): string | null {
  return currentId;
}

export function setFocus(el: HTMLElement | null, scroll = true): void {
  if (!el) return;
  if (current && current !== el) current.classList.remove('focus');
  current = el;
  currentId = el.getAttribute('data-f');
  el.classList.add('focus');
  if (scroll) keepVisible(el);
}

export function focusById(id: string | null): boolean {
  if (!id) return false;
  const el = focusables().find((e) => e.getAttribute('data-f') === id);
  if (el) setFocus(el);
  return !!el;
}

/** Primeiro item fora do trilho, de preferência um visível na tela. */
export function focusFirst(): void {
  const all = focusables();
  const content = all.filter((e) => !e.closest('[data-rail]'));
  const pick = content.find((e) => e.hasAttribute('data-autofocus')) || content[0] || all[0];
  setFocus(pick || null);
}

/** Depois de um re-render, recoloca o foco no mesmo id ou no primeiro item. */
export function restoreFocus(): void {
  if (current && current.isConnected && focusables().includes(current)) {
    current.classList.add('focus');
    return;
  }
  if (!focusById(currentId)) focusFirst();
}

export function move(dir: Dir): void {
  const all = focusables();
  if (!current || !all.includes(current)) {
    focusFirst();
    return;
  }
  const a = current.getBoundingClientRect();
  const ax = a.left + a.width / 2;
  const ay = a.top + a.height / 2;
  const inRail = !!current.closest('[data-rail]');
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const e of all) {
    if (e === current) continue;
    const er = !!e.closest('[data-rail]');
    if (dir !== 'L' && er !== inRail) continue;
    if (inRail && !er && dir === 'L') continue;
    const b = e.getBoundingClientRect();
    const dx = b.left + b.width / 2 - ax;
    const dy = b.top + b.height / 2 - ay;
    const ok = dir === 'L' ? dx < -5 : dir === 'R' ? dx > 5 : dir === 'U' ? dy < -5 : dy > 5;
    if (!ok) continue;
    const score = dir === 'L' || dir === 'R' ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * 0.6;
    if (score < bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (best) setFocus(best);
}

export function activate(): void {
  current?.click();
}

/* ---------- rolagem ---------- */
const CARD_STEP = 376; // largura do card + espaço
const VISIBLE_BEFORE = 3;

function keepVisible(el: HTMLElement): void {
  const track = el.closest<HTMLElement>('[data-track]');
  if (track) {
    const idx = Array.prototype.indexOf.call(track.children, el);
    track.style.transform = `translateX(${-Math.max(0, idx - VISIBLE_BEFORE) * CARD_STEP}px)`;
  }
  const scroller = el.closest<HTMLElement>('[data-scroller]');
  if (scroller) {
    const block = el.closest<HTMLElement>('[data-block]') || el;
    const top = offsetWithin(block, scroller);
    const y = block.hasAttribute('data-hero') ? 0 : Math.max(0, top - 420);
    scroller.style.transform = `translateY(${-y}px)`;
  }
}

function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== ancestor) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

/** Ponteiro do Magic Remote: passar sobre um item o seleciona, sem rolar a tela. */
export function hover(target: EventTarget | null): void {
  const el = (target as HTMLElement | null)?.closest?.('[data-f]') as HTMLElement | null;
  if (el && el !== current && focusables().includes(el)) setFocus(el, false);
}
