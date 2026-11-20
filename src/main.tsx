import './polyfills';
import { render } from 'preact';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import './styles.css';
import { App } from './app';

/* Na TV a janela já é 1920×1080; no navegador do computador, a tela é reduzida para caber. */
function fit() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.transform = s < 0.999 || s > 1.001 ? `scale(${s})` : '';
}
window.addEventListener('resize', fit);

/* Versão mostrada em Ajustes: online (GitHub Pages) ou cópia do pacote. */
const w = window as unknown as { __JWLV_VERSION__?: string };
if (!w.__JWLV_VERSION__) {
  const v = new URLSearchParams(location.search).get('v');
  w.__JWLV_VERSION__ = v ? `${v} (online)` : 'local';
}

render(<App />, document.getElementById('app')!);
fit();
