import { describe, expect, it } from 'vitest';
import { clock, formatDate, isNew, newest, normalize } from '../src/lib/text';
import type { Video } from '../src/api/types';

const now = new Date('2026-11-20T12:00:00Z');
const v = (id: string, published: string) => ({ id, published }) as Video;

describe('texto e datas', () => {
  it('normaliza acentos e caixa', () => expect(normalize('Jeová ÇÃO')).toBe('jeova cao'));
  it('formata data dd/mm/aaaa', () => expect(formatDate('2026-11-02T16:24:21Z')).toBe('02/11/2026'));
  it('formata duração', () => {
    expect(clock(65)).toBe('1:05');
    expect(clock(3600)).toBe('1:00:00');
  });
  it('novo = até 30 dias', () => {
    expect(isNew(v('a', '2026-10-25'), now)).toBe(true);
    expect(isNew(v('b', '2026-10-01'), now)).toBe(false);
    expect(isNew(v('c', ''), now)).toBe(false);
  });
  it('novidades: recentes primeiro, sem repetir', () => {
    const r = newest([v('a', '2026-11-01'), v('b', '2026-11-19'), v('a', '2026-11-01'), v('x', '2025-01-01')], now);
    expect(r.map((x) => x.id)).toEqual(['b', 'a']);
  });
});
