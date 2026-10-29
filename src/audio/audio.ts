/** All sound is synthesised at runtime with the Web Audio API. */
export class AudioEngine {
  ctx?: AudioContext;
  master?: GainNode;
  muted = false;
  private noiseBuf?: AudioBuffer;
  private amb?: { gain: GainNode; hum: OscillatorNode; hum2: OscillatorNode; filt: BiquadFilterNode; nfilt: BiquadFilterNode; ngain: GainNode };
  private stormNodes: { stop: () => void } | null = null;
  private printTimer = 0;

  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.startAmbience();
    } catch { this.ctx = undefined; }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.03);
  }

  private startAmbience() {
    const c = this.ctx!;
    const gain = c.createGain(); gain.gain.value = 0.05; gain.connect(this.master!);
    const filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 260; filt.connect(gain);
    const hum = c.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 55; hum.connect(filt); hum.start();
    const hum2 = c.createOscillator(); hum2.type = 'sine'; hum2.frequency.value = 110.7; hum2.connect(filt); hum2.start();
    const ngain = c.createGain(); ngain.gain.value = 0.35; ngain.connect(gain);
    const nfilt = c.createBiquadFilter(); nfilt.type = 'bandpass'; nfilt.frequency.value = 500; nfilt.Q.value = 0.6; nfilt.connect(ngain);
    const n = c.createBufferSource(); n.buffer = this.noiseBuf!; n.loop = true; n.connect(nfilt); n.start();
    this.amb = { gain, hum, hum2, filt, nfilt, ngain };
  }

  /** Each room has its own machine tone. */
  setRoom(room: string) {
    if (!this.amb || !this.ctx) return;
    const t = this.ctx.currentTime;
    const cfg = { workshop: [60, 320, 520, 0.05], converter: [48, 200, 260, 0.075], quarters: [72, 240, 700, 0.04] }[room] ?? [55, 260, 500, 0.05];
    this.amb.hum.frequency.setTargetAtTime(cfg[0], t, 0.4);
    this.amb.hum2.frequency.setTargetAtTime(cfg[0] * 2.01, t, 0.4);
    this.amb.filt.frequency.setTargetAtTime(cfg[1], t, 0.4);
    this.amb.nfilt.frequency.setTargetAtTime(cfg[2], t, 0.4);
    this.amb.gain.gain.setTargetAtTime(cfg[3], t, 0.4);
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  private tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number, dest?: AudioNode) {
    const c = this.ctx!;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(dest ?? this.master!); o.start(t); o.stop(t + dur + 0.05);
  }
  private noise(t: number, dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, q = 1) {
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf!;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); this.env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(this.master!); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  play(name: string) {
    if (!this.ctx || !this.master) return;
    const c = this.ctx, t = c.currentTime;
    switch (name) {
      case 'step': this.noise(t, 0.07, 0.22, 'bandpass', 380 + Math.random() * 120, 160, 1.4); this.tone('sine', 110, 60, t, 0.06, 0.12); break;
      case 'click': this.noise(t, 0.03, 0.3, 'highpass', 2500, 2000); this.tone('sine', 140, 80, t, 0.05, 0.15); break;
      case 'relay': this.noise(t, 0.02, 0.2, 'highpass', 3200, 2600); this.noise(t + 0.06, 0.02, 0.15, 'highpass', 3000, 2400); break;
      case 'tool': for (let i = 0; i < 5; i++) { this.tone('square', 900 + i * 40, 700, t + i * 0.09, 0.04, 0.05); this.noise(t + i * 0.09, 0.05, 0.12, 'bandpass', 2200, 1500, 3); } break;
      case 'drawer': this.noise(t, 0.38, 0.28, 'lowpass', 900, 160); this.tone('sine', 90, 60, t + 0.3, 0.1, 0.2); break;
      case 'pickup': this.tone('triangle', 520, 780, t, 0.1, 0.18); this.tone('triangle', 780, 1040, t + 0.07, 0.1, 0.14); break;
      case 'activate': {
        this.tone('sawtooth', 70, 520, t, 0.9, 0.12);
        this.tone('sine', 880, 880, t + 0.8, 0.5, 0.15); this.tone('sine', 1320, 1320, t + 0.95, 0.5, 0.1);
        break;
      }
      case 'confirm': this.tone('sine', 660, 660, t, 0.25, 0.2); this.tone('sine', 990, 990, t + 0.12, 0.4, 0.2); break;
      case 'ui': this.tone('square', 760, 700, t, 0.03, 0.05); break;
      case 'blip': this.tone('square', 300 + Math.random() * 120, 280, t, 0.03, 0.03); break;
      case 'chime': this.tone('sine', 523, 523, t, 0.6, 0.16); this.tone('sine', 784, 784, t + 0.1, 0.8, 0.12); break;
      case 'door': this.noise(t, 0.35, 0.28, 'lowpass', 700, 120); this.tone('sawtooth', 80, 50, t, 0.3, 0.1); break;
      default: break;
    }
  }

  /** Four sparse notes. */
  motif() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 587, 523, 440].forEach((f, i) => { this.tone('sine', f, f, t + i * 0.7, 1.6, 0.11); this.tone('triangle', f / 2, f / 2, t + i * 0.7, 1.6, 0.05); });
  }

  printStart(seconds: number) {
    if (!this.ctx) return;
    this.printStop();
    let n = 0;
    this.printTimer = window.setInterval(() => { this.noise(this.ctx!.currentTime, 0.03, 0.12, 'bandpass', 1800, 1400, 4); if (++n > seconds * 14) this.printStop(); }, 70);
  }
  printStop() { if (this.printTimer) { clearInterval(this.printTimer); this.printTimer = 0; } }

  stormStart(seconds: number, reduced: boolean) {
    if (!this.ctx || !this.master) return;
    this.stormStop();
    const c = this.ctx, t = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf!; s.loop = true;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(200, t); f.frequency.linearRampToValueAtTime(1100, t + seconds * 0.4); f.frequency.linearRampToValueAtTime(180, t + seconds);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.32, t + seconds * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + seconds);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(40, t); o.frequency.linearRampToValueAtTime(90, t + seconds * 0.5); o.frequency.linearRampToValueAtTime(38, t + seconds);
    const og = c.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.linearRampToValueAtTime(0.1, t + seconds * 0.4); og.gain.linearRampToValueAtTime(0.0001, t + seconds);
    const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 220;
    o.connect(of); of.connect(og); og.connect(this.master); o.start(t);
    const crackles: number[] = [];
    if (!reduced) for (const ct of [2.4, 4.2, 6.0, 7.6, 9.0]) crackles.push(window.setTimeout(() => { if (this.ctx) { this.noise(this.ctx.currentTime, 0.25, 0.25, 'highpass', 3000, 800); this.tone('sawtooth', 300, 40, this.ctx.currentTime, 0.3, 0.1); } }, ct * 1000));
    this.stormNodes = { stop: () => { try { s.stop(); o.stop(); } catch { /* already stopped */ } crackles.forEach((x) => clearTimeout(x)); } };
  }
  stormStop() { this.stormNodes?.stop(); this.stormNodes = null; }
}
