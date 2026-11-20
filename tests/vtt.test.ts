import { describe, expect, it } from 'vitest';
import { cueAt, parseVtt } from '../src/lib/vtt';

const src = `WEBVTT

00:00:06.573 --> 00:00:08.326 line:90% position:50% align:center
Vamos ser sinceros.

00:00:08.326 --> 00:00:09.787 line:90%
Sua vida é
<i>corrida</i>.

01:02.000 --> 01:03.500
Curto`;

describe('legendas VTT', () => {
  const cues = parseVtt(src);
  it('lê as falas', () => {
    expect(cues).toHaveLength(3);
    expect(cues[1].text).toBe('Sua vida é\ncorrida.');
    expect(cues[2].start).toBe(62);
  });
  it('acha a fala pelo tempo', () => {
    expect(cueAt(cues, 7)).toBe('Vamos ser sinceros.');
    expect(cueAt(cues, 8.4)).toBe('Sua vida é\ncorrida.');
    expect(cueAt(cues, 30)).toBe('');
  });
});
