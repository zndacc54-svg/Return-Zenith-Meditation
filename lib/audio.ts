let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let ambienceOsc: OscillatorNode | null = null;
let ambienceGain: GainNode | null = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playUIHover() {
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.05);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.02, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.1);
}

export function playUIClick() {
  if (!audioCtx) initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

export function playTransition() {
  if (!audioCtx) initAudio();
  if (!audioCtx || !masterGain) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.05, t + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t);
  osc.stop(t + 0.9);
}

export function startAmbience() {
  if (!audioCtx) initAudio();
  if (!audioCtx || !masterGain || ambienceOsc) return;
  const t = audioCtx.currentTime;
  
  ambienceOsc = audioCtx.createOscillator();
  ambienceGain = audioCtx.createGain();
  
  ambienceOsc.type = 'sine';
  ambienceOsc.frequency.setValueAtTime(70, t); // Low hum
  
  ambienceGain.gain.setValueAtTime(0, t);
  ambienceGain.gain.linearRampToValueAtTime(0.03, t + 4); // Slow fade in
  
  // Subtle modulation
  const modOsc = audioCtx.createOscillator();
  const modGain = audioCtx.createGain();
  modOsc.type = 'sine';
  modOsc.frequency.setValueAtTime(0.1, t); // Very slow LFO
  modGain.gain.setValueAtTime(5, t);
  modOsc.connect(modGain);
  modGain.connect(ambienceOsc.frequency);
  modOsc.start(t);
  
  ambienceOsc.connect(ambienceGain);
  ambienceGain.connect(masterGain);
  ambienceOsc.start(t);
}

export function stopAmbience() {
  if (!audioCtx || !ambienceGain || !ambienceOsc) return;
  const t = audioCtx.currentTime;
  ambienceGain.gain.cancelScheduledValues(t);
  ambienceGain.gain.setValueAtTime(ambienceGain.gain.value, t);
  ambienceGain.gain.linearRampToValueAtTime(0.001, t + 2); // Slow fade out
  ambienceOsc.stop(t + 2.1);
  
  setTimeout(() => {
    ambienceOsc = null;
    ambienceGain = null;
  }, 2200);
}

export function playTapSound() {
  if (!audioCtx) initAudio();
  if (!audioCtx || !masterGain) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(250, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);

  gain.gain.setValueAtTime(0.0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, t);

  osc.connect(gain);
  gain.connect(filter);
  filter.connect(masterGain);

  osc.start(t);
  osc.stop(t + 0.1);
}

function playBowlPitched(frequency: number, duration: number, volume: number) {
  if (!audioCtx) initAudio();
  if (!audioCtx || !masterGain) return;

  const t = audioCtx.currentTime;
  
  const osc1 = audioCtx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(frequency, t);

  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2.76, t);

  const osc3 = audioCtx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 5.4, t);
  
  // Adds a bit of shimmer
  const osc4 = audioCtx.createOscillator();
  osc4.type = 'triangle';
  osc4.frequency.setValueAtTime(frequency * 2.76 + 2, t);

  const gain1 = audioCtx.createGain();
  const gain2 = audioCtx.createGain();
  const gain3 = audioCtx.createGain();
  const gain4 = audioCtx.createGain();

  gain1.gain.setValueAtTime(0, t);
  gain1.gain.linearRampToValueAtTime(volume, t + 0.1);
  gain1.gain.exponentialRampToValueAtTime(0.001, t + duration);

  gain2.gain.setValueAtTime(0, t);
  gain2.gain.linearRampToValueAtTime(volume * 0.4, t + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);

  gain3.gain.setValueAtTime(0, t);
  gain3.gain.linearRampToValueAtTime(volume * 0.1, t + 0.02);
  gain3.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.3);
  
  gain4.gain.setValueAtTime(0, t);
  gain4.gain.linearRampToValueAtTime(volume * 0.05, t + 0.08);
  gain4.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.5);

  osc1.connect(gain1);
  osc2.connect(gain2);
  osc3.connect(gain3);
  osc4.connect(gain4);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2500, t);
  
  gain1.connect(filter);
  gain2.connect(filter);
  gain3.connect(filter);
  gain4.connect(filter);
  
  filter.connect(masterGain);

  osc1.start(t);
  osc2.start(t);
  osc3.start(t);
  osc4.start(t);

  osc1.stop(t + duration + 0.1);
  osc2.stop(t + duration * 0.6 + 0.1);
  osc3.stop(t + duration * 0.3 + 0.1);
  osc4.stop(t + duration * 0.5 + 0.1);
}

export function playIntervalBowl() {
  playBowlPitched(380, 5, 0.5);
}

export function playEndBowl() {
  playBowlPitched(220, 8, 0.8);
}
