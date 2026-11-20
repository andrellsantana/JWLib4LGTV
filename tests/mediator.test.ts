import { describe, expect, it } from 'vitest';
import { toCategory } from '../src/api/mediator';

const raw = {
  key: 'VODStudio',
  name: 'De Nosso Estúdio',
  description: 'Programas mensais',
  subcategories: [
    {
      key: 'StudioMonthlyPrograms',
      name: 'Programas Mensais',
      media: [
        {
          naturalKey: 'pub-jwb-143_T_1_VIDEO',
          languageAgnosticNaturalKey: 'pub-jwb-143_1_VIDEO',
          title: 'JW Broadcasting — Novembro de 2026',
          firstPublished: '2026-11-02T16:24:21.884Z',
          duration: 3600.97,
          durationFormattedHHMM: '1:00:00',
          images: { wss: { lg: 'https://img/wss_lg.jpg', sm: 'https://img/wss_sm.jpg' }, lsr: { xl: 'https://img/lsr.jpg' } },
          files: [
            { progressiveDownloadURL: 'https://v/720.mp4', label: '720p', frameHeight: 720, mimetype: 'video/mp4', subtitles: { url: 'https://v/s.vtt' } },
            { progressiveDownloadURL: 'https://v/144.3gp', label: '144p', mimetype: 'video/3gpp' },
            { progressiveDownloadURL: 'https://v/240.mp4', label: '240p', frameHeight: 240, mimetype: 'video/mp4' },
          ],
        },
      ],
    },
    { key: 'Empty', name: 'Vazia', media: [] },
  ],
};

describe('conversão da API do JW.org', () => {
  const c = toCategory(raw);
  it('ignora subcategorias vazias', () => expect(c.subcategories.map((s) => s.key)).toEqual(['StudioMonthlyPrograms']));
  it('mapeia o vídeo', () => {
    const v = c.subcategories[0].videos[0];
    expect(v.id).toBe('pub-jwb-143_T_1_VIDEO');
    expect(v.langAgnosticId).toBe('pub-jwb-143_1_VIDEO');
    expect(v.duration).toBe(3601);
    expect(v.thumb).toBe('https://img/wss_lg.jpg');
    expect(v.image).toBe('https://img/lsr.jpg');
    expect(v.category).toBe('De Nosso Estúdio');
  });
  it('mantém só MP4, do menor para o maior', () => {
    const f = c.subcategories[0].videos[0].files;
    expect(f.map((x) => x.label)).toEqual(['240p', '720p']);
    expect(f[1].subtitles).toBe('https://v/s.vtt');
  });
});
