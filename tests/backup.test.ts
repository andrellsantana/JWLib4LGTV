import { describe, expect, it } from 'vitest';
import { newCode, validCode } from '../src/lib/backup';

describe('código da cópia de segurança', () => {
  it('tem 6 caracteres sem letras ambíguas', () => {
    for (let i = 0; i < 50; i++) {
      const c = newCode();
      expect(validCode(c)).toBe(true);
      expect(c).not.toMatch(/[01OI]/);
    }
  });
  it('rejeita códigos inválidos', () => {
    expect(validCode('ABC12')).toBe(false);
    expect(validCode('ABCDE0')).toBe(false);
    expect(validCode('abcdef')).toBe(false);
  });
});
