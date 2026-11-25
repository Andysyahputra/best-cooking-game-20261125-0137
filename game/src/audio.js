// Sizzle & Serve — WebAudio synth blips. No audio files, no network.
// One job: every sound effect, synthesized on the fly.

export function createAudio() {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      } catch (e) {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const ac = ensure();
    if (!ac) return;
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + dur + 0.02);
    } catch (e) { /* audio is garnish; never break the game */ }
  }

  function noise(dur, vol, lowpass) {
    const ac = ensure();
    if (!ac) return;
    try {
      const len = Math.floor(ac.sampleRate * dur);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ac.createBufferSource();
      src.buffer = buf;
      const filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass || 1200;
      const gain = ac.createGain();
      gain.gain.value = vol || 0.1;
      src.connect(filter).connect(gain).connect(ac.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  return {
    unlock() { ensure(); },
    pickup() { tone(520, 0.09, 'triangle', 0.12, 760); },
    putdown() { tone(340, 0.08, 'triangle', 0.1, 260); },
    chop() { noise(0.07, 0.16, 2600); tone(180, 0.05, 'square', 0.05); },
    sizzle() { noise(0.35, 0.05, 5200); },
    ding() { tone(880, 0.18, 'sine', 0.14); tone(1320, 0.28, 'sine', 0.1); },
    serve() {
      tone(660, 0.1, 'triangle', 0.14);
      setTimeout(() => tone(990, 0.16, 'triangle', 0.14), 90);
    },
    burn() { tone(220, 0.35, 'sawtooth', 0.1, 90); noise(0.3, 0.08, 700); },
    error() { tone(160, 0.16, 'square', 0.08, 110); },
    click() { tone(700, 0.05, 'sine', 0.1); },
    expire() { tone(330, 0.2, 'sine', 0.1, 180); tone(220, 0.3, 'sine', 0.09); },
    tick() { tone(1100, 0.04, 'square', 0.05); },
  };
}
