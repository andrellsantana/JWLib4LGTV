import { describe, expect, it } from 'vitest';
import { pickFile } from '../src/api/mediator';
import type { Video } from '../src/api/types';

const v = { files: [240, 360, 480, 720].map((h) => ({ label: `${h}p`, url: `${h}.mp4`, height: h })) } as Video;

describe('qualidade', () => {
  it('usa a pedida', () => expect(pickFile(v, '720p')?.label).toBe('720p'));
  it('usa a mais próxima abaixo', () => expect(pickFile({ ...v, files: v.files.slice(0, 2) } as Video, '720p')?.label).toBe('360p'));
});
