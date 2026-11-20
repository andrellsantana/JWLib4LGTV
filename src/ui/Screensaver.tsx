import { useEffect, useState } from 'preact/hooks';
import { describe, getWeather, type Weather } from '../lib/weather';

const SWITCH_MS = 20000;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Proteção de tela (RF22): imagem de fundo alternando relógio e previsão do Rio. */
export function Screensaver({ withImage }: { withImage: boolean }) {
  const [now, setNow] = useState(new Date());
  const [pane, setPane] = useState(0);
  const [w, setW] = useState<Weather | null>(null);
  useEffect(() => {
    getWeather().then(setW);
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    const flip = window.setInterval(() => {
      setPane((p) => 1 - p);
      getWeather().then(setW);
    }, SWITCH_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(flip);
    };
  }, []);
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const showWeather = pane === 1 && !!w;
  return (
    <div class="fill saver" style={withImage ? { background: '#010b2e url(./bg.jpg) center / cover' } : undefined}>
      <div class="pane" style={{ opacity: showWeather ? 0 : 1 }}>
        <div class="clock">
          {hh}:{mm}
        </div>
        <div class="date">{cap(now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
      </div>
      {w ? (
        <div class="pane" style={{ opacity: showWeather ? 1 : 0 }}>
          <div class="wd">Rio de Janeiro · agora</div>
          <div class="wnow">
            <div class="wt">{w.now.temp}°</div>
            <div class="wi">{describe(w.now.code).icon}</div>
            <div class="wd">{describe(w.now.code).text}</div>
          </div>
          <div class="days">
            {w.days.map((d) => (
              <div class="day" key={d.date}>
                <b>{new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}</b>
                {describe(d.code).icon} {d.max}° / {d.min}°
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div class="src">Qualquer botão volta ao app</div>
    </div>
  );
}
