import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = join(process.cwd(), "public", "audio", "starter");

let noiseState = 0x2f6e2b1;

function noise() {
  noiseState = (noiseState * 1664525 + 1013904223) >>> 0;
  return (noiseState / 0xffffffff) * 2 - 1;
}

function midiToHz(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function osc(type, phase) {
  const turn = phase / (Math.PI * 2);
  if (type === "square") return Math.sin(phase) >= 0 ? 1 : -1;
  if (type === "saw") return 2 * (turn - Math.floor(turn + 0.5));
  if (type === "triangle") return 2 * Math.abs(2 * (turn - Math.floor(turn + 0.5))) - 1;
  return Math.sin(phase);
}

function decay(t, seconds) {
  return Math.exp(-t / seconds);
}

function attack(t, seconds) {
  return Math.min(t / seconds, 1);
}

function render(duration, voice) {
  const length = Math.ceil(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);
  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const fadeOut = Math.min((duration - t) / 0.012, 1);
    const value = voice(t, i) * Math.max(fadeOut, 0);
    samples[i] = value;
    peak = Math.max(peak, Math.abs(value));
  }
  const gain = peak > 0 ? 0.82 / peak : 1;
  for (let i = 0; i < samples.length; i += 1) samples[i] *= gain;
  return samples;
}

function tonal(duration, midi, type, harmonics, envelope, modulation = () => 0) {
  const frequency = midiToHz(midi);
  return render(duration, (t) => {
    const mod = modulation(t);
    return harmonics.reduce((sum, amount, index) => {
      const harmonic = index + 1;
      return sum + osc(type, Math.PI * 2 * frequency * harmonic * t + mod * harmonic) * amount;
    }, 0) * envelope(t);
  });
}

const sounds = [
  ["01-mono-bass.wav", 1.2, () => render(1.2, (t) => {
    const f = midiToHz(36) * (1 + 0.12 * Math.exp(-t / 0.035));
    return attack(t, 0.006) * decay(t, 0.5) * (Math.sin(Math.PI * 2 * f * t) + 0.22 * Math.sin(Math.PI * 4 * f * t));
  })],
  ["02-glass-chord.wav", 1.45, () => render(1.45, (t) => [60, 63, 67].reduce((sum, midi, index) => {
    const f = midiToHz(midi);
    const bell = Math.sin(Math.PI * 2 * f * t + 1.8 * Math.sin(Math.PI * 2 * f * 2.01 * t));
    return sum + bell * decay(t, 0.42 + index * 0.08);
  }, 0) * attack(t, 0.004))],
  ["03-dust-lead.wav", 1.1, () => tonal(1.1, 60, "saw", [1, 0.35, 0.16], (t) => attack(t, 0.012) * decay(t, 0.62), (t) => 0.04 * Math.sin(Math.PI * 11 * t))],
  ["04-square-pluck.wav", 0.72, () => tonal(0.72, 60, "square", [1, 0.18, 0.07], (t) => attack(t, 0.002) * decay(t, 0.16))],
  ["05-tape-organ.wav", 1.6, () => tonal(1.6, 60, "sine", [1, 0.46, 0.22, 0.12], (t) => attack(t, 0.04) * decay(t, 1.8), (t) => 0.018 * Math.sin(Math.PI * 3.3 * t))],
  ["06-soft-vox.wav", 1.5, () => render(1.5, (t) => {
    const f = midiToHz(60);
    const vowel = Math.sin(Math.PI * 2 * f * t) + 0.42 * Math.sin(Math.PI * 2 * f * 3 * t) + 0.24 * Math.sin(Math.PI * 2 * f * 5 * t);
    return vowel * attack(t, 0.09) * decay(t, 1.2) + noise() * 0.025 * decay(t, 0.7);
  })],
  ["07-arcade-note.wav", 0.62, () => render(0.62, (t) => {
    const f = midiToHz(72) * (t > 0.12 ? 1.5 : 1);
    return osc("square", Math.PI * 2 * f * t) * attack(t, 0.002) * decay(t, 0.18);
  })],
  ["08-warm-stab.wav", 0.82, () => render(0.82, (t) => [60, 63, 67].reduce((sum, midi) => {
    const f = midiToHz(midi);
    return sum + osc("saw", Math.PI * 2 * f * t) * 0.7 + Math.sin(Math.PI * 2 * f * t) * 0.3;
  }, 0) * attack(t, 0.008) * decay(t, 0.24))],
  ["09-kick.wav", 0.52, () => render(0.52, (t) => {
    const phase = Math.PI * 2 * (48 * t + 52 * 0.035 * (1 - Math.exp(-t / 0.035)));
    return Math.sin(phase) * decay(t, 0.16) + noise() * 0.08 * decay(t, 0.012);
  })],
  ["10-snare.wav", 0.42, () => render(0.42, (t) => noise() * decay(t, 0.11) + Math.sin(Math.PI * 2 * 185 * t) * 0.45 * decay(t, 0.08))],
  ["11-closed-hat.wav", 0.12, () => render(0.12, (t) => (noise() * 0.7 + osc("square", Math.PI * 2 * 7100 * t) * 0.3) * decay(t, 0.026))],
  ["12-open-hat.wav", 0.62, () => render(0.62, (t) => (noise() * 0.72 + osc("square", Math.PI * 2 * 6200 * t) * 0.28) * attack(t, 0.001) * decay(t, 0.22))],
  ["13-clap.wav", 0.38, () => render(0.38, (t) => {
    const burst = [0, 0.028, 0.055].reduce((sum, start) => sum + (t >= start ? decay(t - start, 0.018) : 0), 0);
    return noise() * burst + noise() * 0.3 * decay(t, 0.12);
  })],
  ["14-rim.wav", 0.18, () => render(0.18, (t) => (Math.sin(Math.PI * 2 * 920 * t) + 0.5 * Math.sin(Math.PI * 2 * 1320 * t)) * decay(t, 0.035))],
  ["15-perc.wav", 0.38, () => render(0.38, (t) => Math.sin(Math.PI * 2 * (420 - 150 * t) * t) * decay(t, 0.09))],
  ["16-texture.wav", 0.72, () => render(0.72, (t) => (noise() * 0.55 + Math.sin(Math.PI * 2 * (180 + 90 * Math.sin(t * 7)) * t) * 0.45) * attack(t, 0.02) * decay(t, 0.28))]
];

function encodeWav(samples) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  }
  return buffer;
}

await mkdir(OUTPUT_DIR, { recursive: true });
for (const [name, , create] of sounds) {
  await writeFile(join(OUTPUT_DIR, name), encodeWav(create()));
}

console.log(`Generated ${sounds.length} original starter samples in ${OUTPUT_DIR}`);
