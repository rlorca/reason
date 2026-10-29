/** Flickersoft studio card: rainbow pixel wordmark over "PRESENTS", drawn from a 5x7 bitmap font. */
const FONT: Record<string, string[]> = {
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
};
const RAINBOW = ['#ff4a12', '#e8691c', '#f5a05a', '#f5b800', '#a8f020', '#12b012', '#12e8e0', '#1478f0', '#6a4ae8', '#d01ac8', '#f0508c'];

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * k).toString(16).padStart(2, '0');
  return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255);
}

export function drawSplash(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const word = 'FLICKERSOFT';
  const x0 = Math.floor((canvas.width - (word.length * 6 - 1)) / 2);
  [...word].forEach((ch, i) => {
    const base = RAINBOW[i], dark = shade(base, 0.62);
    FONT[ch].forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit !== '1') return;
      ctx.fillStyle = dark; ctx.fillRect(x0 + i * 6 + x + 1, 6 + y + 1, 1, 1);
    }));
    FONT[ch].forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit !== '1') return;
      ctx.fillStyle = base; ctx.fillRect(x0 + i * 6 + x, 6 + y, 1, 1);
    }));
    ctx.fillStyle = base; ctx.fillRect(x0 + i * 6, 16, 6, 1);
    ctx.fillStyle = dark; ctx.fillRect(x0 + i * 6, 17, 6, 1);
  });
  const p = 'PRESENTS';
  const px = Math.floor((canvas.width - (p.length * 6 - 1)) / 2);
  ctx.fillStyle = '#fff';
  [...p].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((bit, x) => { if (bit === '1') ctx.fillRect(px + i * 6 + x, 22 + y, 1, 1); })));
}

export function runSplash(done: () => void) {
  const el = document.getElementById('splash')!;
  drawSplash(el.querySelector('canvas') as HTMLCanvasElement);
  el.hidden = false;
  let over = false;
  const end = () => { if (over) return; over = true; el.hidden = true; done(); };
  el.addEventListener('click', end);
  window.addEventListener('keydown', end, { once: true });
  window.setTimeout(end, 2800);
}
