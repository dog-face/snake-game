// Script to generate sound effect files for FPS game
// Uses Web Audio API concepts to generate WAV files

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import wavefile from 'wavefile';
const { WaveFile } = wavefile;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create sounds directory if it doesn't exist
const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// Helper function to generate a tone
function generateTone(frequency, duration, sampleRate, type = 'sine', envelope = true) {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let value = 0;
    
    switch (type) {
      case 'sine':
        value = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        value = Math.sign(Math.sin(2 * Math.PI * frequency * t));
        break;
      case 'sawtooth':
        value = 2 * ((t * frequency) % 1) - 1;
        break;
      case 'triangle':
        const phase = (t * frequency) % 1;
        value = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
        break;
      default:
        value = Math.sin(2 * Math.PI * frequency * t);
    }
    
    // Apply envelope (fade out)
    if (envelope) {
      const fadeOut = Math.max(0, 1 - (t / duration));
      value *= 0.3 * fadeOut;
    } else {
      value *= 0.3;
    }
    
    samples[i] = value;
  }
  
  return samples;
}

// Helper function to add noise
function addNoise(samples, amount = 0.1) {
  for (let i = 0; i < samples.length; i++) {
    samples[i] += (Math.random() * 2 - 1) * amount;
    samples[i] = Math.max(-1, Math.min(1, samples[i]));
  }
  return samples;
}

// Helper function to save WAV file
function saveWavFile(filename, samples, sampleRate = 44100) {
  const wav = new WaveFile();
  wav.fromScratch(1, sampleRate, '32f', samples);
  wav.toBitDepth('16');
  
  const filePath = path.join(soundsDir, filename);
  fs.writeFileSync(filePath, wav.toBuffer());
  console.log(`Generated: ${filename}`);
}

// Generate shoot sound - short, sharp click with high frequency
function generateShootSound() {
  const sampleRate = 44100;
  const duration = 0.05; // 50ms
  const samples = generateTone(800, duration, sampleRate, 'square', true);
  addNoise(samples, 0.15);
  saveWavFile('shoot.wav', samples, sampleRate);
}

// Generate hit sound - higher pitch, shorter, more satisfying
function generateHitSound() {
  const sampleRate = 44100;
  const duration = 0.1; // 100ms
  // Mix of frequencies for a more interesting sound
  const samples1 = generateTone(600, duration, sampleRate, 'sine', true);
  const samples2 = generateTone(1200, duration, sampleRate, 'sine', true);
  const samples = new Float32Array(samples1.length);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (samples1[i] * 0.6 + samples2[i] * 0.4);
  }
  saveWavFile('hit.wav', samples, sampleRate);
}

// Generate reload sound - lower pitch, longer, mechanical
function generateReloadSound() {
  const sampleRate = 44100;
  const duration = 0.3; // 300ms
  const samples1 = generateTone(200, duration, sampleRate, 'sawtooth', true);
  const samples2 = generateTone(150, duration, sampleRate, 'square', true);
  const samples = new Float32Array(samples1.length);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (samples1[i] * 0.7 + samples2[i] * 0.3);
  }
  addNoise(samples, 0.1);
  saveWavFile('reload.wav', samples, sampleRate);
}

// Generate empty clip sound - very short, high pitch click
function generateEmptySound() {
  const sampleRate = 44100;
  const duration = 0.05; // 50ms
  const samples = generateTone(400, duration, sampleRate, 'square', true);
  addNoise(samples, 0.2);
  saveWavFile('empty.wav', samples, sampleRate);
}

// Generate ambient sound - low frequency hum, longer duration
function generateAmbientSound() {
  const sampleRate = 44100;
  const duration = 2.0; // 2 seconds (will loop)
  // Low frequency hum with slight variation
  const samples1 = generateTone(60, duration, sampleRate, 'sine', false);
  const samples2 = generateTone(80, duration, sampleRate, 'sine', false);
  const samples = new Float32Array(samples1.length);
  for (let i = 0; i < samples.length; i++) {
    // Mix with slight phase difference for texture
    const phase = i / sampleRate;
    samples[i] = (samples1[i] * 0.6 + samples2[i] * 0.4) * 0.15; // Lower volume for ambient
  }
  saveWavFile('ambient.wav', samples, sampleRate);
}

// Generate all sounds
console.log('Generating sound effects...');
generateShootSound();
generateHitSound();
generateReloadSound();
generateEmptySound();
generateAmbientSound();
console.log('All sound effects generated successfully!');

