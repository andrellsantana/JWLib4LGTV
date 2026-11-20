/* O webOS 5 usa Chromium 68: completa o que falta nele (flat/flatMap chegaram no Chrome 69). */
const AP = Array.prototype as unknown as Record<string, unknown>;
if (!AP.flat) {
  AP.flat = function flat(this: unknown[], depth = 1): unknown[] {
    return depth < 1
      ? this.slice()
      : this.reduce<unknown[]>((acc, v) => acc.concat(Array.isArray(v) ? (v as unknown[] & { flat: (d: number) => unknown[] }).flat(depth - 1) : v), []);
  };
}
if (!AP.flatMap) {
  AP.flatMap = function flatMap(this: unknown[], fn: (v: unknown, i: number, a: unknown[]) => unknown, thisArg?: unknown): unknown[] {
    return this.map(fn, thisArg).reduce<unknown[]>((acc, v) => acc.concat(v as unknown[]), []);
  };
}
export {};
