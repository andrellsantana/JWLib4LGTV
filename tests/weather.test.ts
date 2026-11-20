import { describe as d, expect, it } from 'vitest';
import { describe, parseWeather } from '../src/lib/weather';

d('previsão do tempo', () => {
  it('lê a resposta do Open-Meteo', () => {
    const w = parseWeather({
      current: { temperature_2m: 27.4, weather_code: 2 },
      daily: { time: ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'], weather_code: [2, 0, 61, 95], temperature_2m_max: [30, 31.2, 28, 25], temperature_2m_min: [21, 22, 21.6, 20] },
    });
    expect(w.now.temp).toBe(27);
    expect(w.days).toHaveLength(3);
    expect(w.days[0]).toEqual({ date: '2026-11-21', code: 0, max: 31, min: 22 });
  });
  it('descreve os códigos', () => {
    expect(describe(0).text).toBe('Céu limpo');
    expect(describe(63).text).toBe('Chuva');
    expect(describe(95).text).toBe('Tempestade');
  });
});
