/*
 * Monta os pacotes a partir de dist/app (gerado pelo `vite build`):
 *   dist/tv     → conteúdo do .ipk: carregador + app embutido (cópia de segurança)
 *   dist/pages  → site do GitHub Pages: app.js, app.css, assets, version.json
 * O endereço do GitHub Pages vem de JWLV_REMOTE ou do repositório git.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

function remoteBase() {
  if (process.env.JWLV_REMOTE) return process.env.JWLV_REMOTE.replace(/\/?$/, '/');
  try {
    const url = execSync('git config --get remote.origin.url').toString().trim();
    const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/) || url.match(/\/git\/([^/]+)\/([^/.]+)/);
    if (m) return `https://${m[1].toLowerCase()}.github.io/${m[2]}/`;
  } catch {
    /* sem git */
  }
  return '';
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
let sha = 'local';
try {
  sha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  /* sem git */
}
const version = `${pkg.version}+${sha}`;
const remote = remoteBase();

// Pacote da TV
rmSync('dist/tv', { recursive: true, force: true });
mkdirSync('dist/tv', { recursive: true });
cpSync('dist/app', 'dist/tv/app', { recursive: true });
cpSync('dist/app/bg.jpg', 'dist/tv/bg.jpg');
for (const f of ['appinfo.json', 'icon.png', 'largeIcon.png', 'splash.png']) cpSync(`webos/${f}`, `dist/tv/${f}`);
const appinfo = JSON.parse(readFileSync('webos/appinfo.json', 'utf8'));
appinfo.version = pkg.version;
writeFileSync('dist/tv/appinfo.json', JSON.stringify(appinfo, null, 2));
writeFileSync('dist/tv/index.html', readFileSync('loader/index.html', 'utf8').replace('__REMOTE__', remote));

// Site do GitHub Pages
rmSync('dist/pages', { recursive: true, force: true });
cpSync('dist/app', 'dist/pages', { recursive: true });
writeFileSync('dist/pages/version.json', JSON.stringify({ version, builtAt: new Date().toISOString() }));
writeFileSync('dist/pages/.nojekyll', '');

console.log(`Versão ${version}\nAtualizações em: ${remote || '(sem endereço; só a cópia do pacote)'}`);
