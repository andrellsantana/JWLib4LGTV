/** Timer para desligar (RF18): por tempo ou ao fim do vídeo atual. */
export type TimerMode = 'off' | 'end' | number; // número = minutos

let mode: TimerMode = 'off';
let endsAt = 0;

export function setTimer(m: TimerMode, now = Date.now()) {
  mode = m;
  endsAt = typeof m === 'number' ? now + m * 60000 : 0;
}
export const getTimer = () => mode;
export function remainingMs(now = Date.now()): number {
  return typeof mode === 'number' ? Math.max(0, endsAt - now) : Infinity;
}
export function timerLabel(now = Date.now()): string {
  if (mode === 'off') return 'Timer';
  if (mode === 'end') return 'Fim do vídeo';
  return `${Math.ceil(remainingMs(now) / 60000)} min`;
}
