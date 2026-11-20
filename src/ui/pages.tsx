import type { Video } from '../api/types';
import {
  clearAll,
  getFavorites,
  getSettings,
  inProgress,
  LANGS,
  setSetting,
  type Background,
  type Quality,
  type SubSize,
} from '../lib/prefs';
import { Row } from './Row';
import { useState } from 'preact/hooks';
import { backupEnabled, getCode, lastBackupAt, restore, upload, validCode } from '../lib/backup';
import { formatDate } from '../lib/text';

type Find = (id: string) => Video | undefined;
type Open = (v: Video) => void;

export function listOf(ids: string[], find: Find): Video[] {
  return ids.map(find).filter((v): v is Video => !!v);
}

export function Favorites({ find, onOpen }: { find: Find; onOpen: Open }) {
  const favs = listOf(getFavorites(), find);
  const cont = listOf(inProgress(), find);
  return (
    <div class="scroller page" data-scroller>
      <h1>Minha lista</h1>
      <p class="lead">Para tirar um vídeo daqui, segure OK sobre ele ou abra os detalhes.</p>
      {!favs.length && !cont.length ? <p class="lead">Nada aqui ainda. Use “Favoritar” nos detalhes de um vídeo.</p> : null}
      <Row id="fav" title="Favoritos" videos={favs} onOpen={onOpen} />
      <Row id="cont" title="Continuar assistindo" extra="sai sozinho ao chegar perto do fim" videos={cont} onOpen={onOpen} />
    </div>
  );
}

function Seg<T extends string>({ title, k, value, opts, onPick }: { title: string; k: string; value: T; opts: Array<[T, string]>; onPick: (v: T) => void }) {
  return (
    <section data-block>
      <h3>{title}</h3>
      <div class="seg">
        {opts.map(([v, label]) => (
          <button key={v} class={'btn' + (value === v ? ' sel' : '')} data-f={`set:${k}:${v}`} onClick={() => onPick(v)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

export function Settings({ notify }: { notify: (m: string) => void }) {
  const s = getSettings();
  const saved = () => notify('Salvo');
  return (
    <div class="scroller page set" data-scroller>
      <h1>Ajustes</h1>
      <Seg<Quality> title="Qualidade padrão" k="q" value={s.quality} opts={[['720p', '720p (padrão)'], ['480p', '480p'], ['360p', '360p'], ['240p', '240p']]} onPick={(v) => (setSetting('quality', v), saved())} />
      <Seg title="Legendas" k="sub" value={s.subLang} opts={[['off', 'Desligadas'] as [string, string]].concat(LANGS.filter((l) => l[0] !== 'LSB'))} onPick={(v) => (setSetting('subLang', v), saved())} />
      <Seg<SubSize> title="Tamanho da legenda" k="size" value={s.subSize} opts={[['p', 'Pequeno'], ['m', 'Médio'], ['g', 'Grande']]} onPick={(v) => (setSetting('subSize', v), saved())} />
      <Seg title="Idioma dos vídeos" k="lang" value={s.audioLang} opts={LANGS} onPick={(v) => (setSetting('audioLang', v), saved())} />
      <Seg<Background>
        title="Fundo de tela"
        k="bg"
        value={s.bg}
        opts={[['img', 'Imagem padrão'], ['rand', 'Trocar por outro'], ['off', 'Remover fundo']]}
        onPick={(v) => {
          setSetting('bg', v);
          if (v === 'rand') setSetting('seed', 1 + Math.floor(Math.random() * 2e9));
          notify(v === 'off' ? 'Fundo removido' : v === 'rand' ? 'Novo fundo aplicado' : 'Imagem padrão aplicada');
        }}
      />
      <Backup notify={notify} />
      <section data-block>
        <h3>Dados</h3>
        <div class="seg">
          <button class="btn" data-f="set:clear" onClick={() => (clearAll(), notify('Favoritos e histórico apagados'))}>
            Apagar favoritos e histórico
          </button>
        </div>
        <p class="note">Versão {(window as unknown as { __JWLV_VERSION__?: string }).__JWLV_VERSION__ || 'local'} · vídeos do JW.org</p>
      </section>
    </div>
  );
}

const CODE_KEYS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'.split('');

/** Cópia de segurança (RF17): mostra o código e permite restaurar com outro. */
function Backup({ notify }: { notify: (m: string) => void }) {
  const [typing, setTyping] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  if (!backupEnabled()) {
    return (
      <section data-block>
        <h3>Cópia de segurança</h3>
        <p class="note">Ainda não configurada (Firebase). Veja o README.</p>
      </section>
    );
  }
  const at = lastBackupAt();
  const doRestore = async () => {
    if (!validCode(code)) return notify('O código tem 6 caracteres');
    setBusy(true);
    const r = await restore(code);
    setBusy(false);
    if (r === 'ok') {
      setTyping(false);
      notify('Favoritos, progresso e ajustes restaurados');
    } else notify(r === 'not-found' ? 'Nenhuma cópia com esse código' : 'Sem conexão com a cópia de segurança');
  };
  return (
    <section data-block>
      <h3>Cópia de segurança</h3>
      <p class="note">
        Seu código: <b class="code">{getCode()}</b>
        {at ? ` · última cópia em ${formatDate(at)} às ${at.slice(11, 16)} (UTC)` : ''}. Anote-o: ele restaura seus dados após reinstalar o app.
      </p>
      <div class="seg" style={{ marginTop: 14 }}>
        <button class="btn" data-f="bk:now" onClick={async () => notify((await upload()) ? 'Cópia feita' : 'Não foi possível copiar agora')}>
          Copiar agora
        </button>
        <button class="btn" data-f="bk:restore" onClick={() => (setTyping(!typing), setCode(''))}>
          Restaurar com código
        </button>
      </div>
      {typing ? (
        <div>
          <div class="sbox" style={{ width: 420 }}>
            {code || <span class="ph">Digite o código</span>}
          </div>
          <div class="kb wide8">
            {CODE_KEYS.map((k) => (
              <div key={k} class="key" data-f={`ck:${k}`} onClick={() => setCode((c) => (c.length < 6 ? c + k : c))}>
                {k}
              </div>
            ))}
            <div class="key wide" data-f="ck:del" onClick={() => setCode((c) => c.slice(0, -1))}>
              Apagar
            </div>
            <div class="key wide" data-f="ck:ok" onClick={busy ? undefined : doRestore}>
              {busy ? 'Aguarde…' : 'Restaurar'}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
