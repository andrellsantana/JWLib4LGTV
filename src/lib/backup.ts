/*
 * Cópia de segurança no Firebase (RF17), pela API REST (sem SDK, para caber no
 * navegador antigo da TV). Login anônimo: nenhum e-mail ou senha fica na TV.
 * Os dados ficam no documento backups/{código}; o código de 6 caracteres é a
 * chave para restaurar depois de reinstalar.
 */
import { exportData, importData, onPrefsChange, type Snapshot } from './prefs';
import { load, save } from './storage';

const API_KEY = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined) || '';
const PROJECT = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined) || '';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O e 1/I, para não confundir
const DEBOUNCE_MS = 10000;

export const backupEnabled = () => !!(API_KEY && PROJECT);

interface Auth {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function newCode(rand: () => number = Math.random): string {
  let c = '';
  for (let i = 0; i < 6; i++) c += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return c;
}
export const validCode = (c: string) => new RegExp(`^[${ALPHABET}]{6}$`).test(c);

export function getCode(): string {
  let c = load<string>('backupCode', '');
  if (!c) {
    c = newCode();
    save('backupCode', c);
  }
  return c;
}

async function auth(): Promise<string> {
  let a = load<Auth | null>('fbAuth', null);
  if (a && a.expiresAt > Date.now() + 60000) return a.idToken;
  let res: Response;
  if (a) {
    res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(a.refreshToken)}`,
    });
    if (res.ok) {
      const j = await res.json();
      a = { idToken: j.id_token, refreshToken: j.refresh_token, expiresAt: Date.now() + Number(j.expires_in) * 1000 };
      save('fbAuth', a);
      return a.idToken;
    }
  }
  res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  if (!res.ok) throw new Error('login anônimo falhou');
  const j = await res.json();
  a = { idToken: j.idToken, refreshToken: j.refreshToken, expiresAt: Date.now() + Number(j.expiresIn) * 1000 };
  save('fbAuth', a);
  return a.idToken;
}

const docUrl = (code: string) =>
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/backups/${code}?key=${API_KEY}`;

export async function upload(code = getCode()): Promise<boolean> {
  if (!backupEnabled()) return false;
  try {
    const token = await auth();
    const res = await fetch(docUrl(code), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        fields: { data: { stringValue: JSON.stringify(exportData()) }, updatedAt: { timestampValue: new Date().toISOString() } },
      }),
    });
    if (res.ok) save('backupAt', new Date().toISOString());
    return res.ok;
  } catch {
    return false;
  }
}

export type RestoreResult = 'ok' | 'not-found' | 'error';

export async function restore(code: string): Promise<RestoreResult> {
  if (!backupEnabled()) return 'error';
  try {
    const token = await auth();
    const res = await fetch(docUrl(code), { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return 'not-found';
    if (!res.ok) return 'error';
    const j = await res.json();
    const data = JSON.parse(j.fields.data.stringValue) as Snapshot;
    importData(data);
    save('backupCode', code); // passa a usar o código restaurado
    return 'ok';
  } catch {
    return 'error';
  }
}

export const lastBackupAt = () => load<string | null>('backupAt', null);

/** Liga a cópia automática: 10 s depois de cada mudança. */
export function startAutoBackup(): () => void {
  if (!backupEnabled()) return () => undefined;
  let timer = 0;
  const off = onPrefsChange(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => upload(), DEBOUNCE_MS);
  });
  upload();
  return () => {
    off();
    window.clearTimeout(timer);
  };
}
