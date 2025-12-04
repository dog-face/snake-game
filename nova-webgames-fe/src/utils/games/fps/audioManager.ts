// Audio manager for FPS game sound effects
import { Howl, Howler } from 'howler';

export interface AudioConfig {
  masterVolume?: number;
  sfxVolume?: number;
  musicVolume?: number;
  muted?: boolean;
}

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  rate?: number;
}

// Sound effect names
export const SOUNDS = {
  SHOOT: 'shoot',
  HIT: 'hit',
  RELOAD: 'reload',
  EMPTY: 'empty',
  AMBIENT: 'ambient',
} as const;

export type SoundName = typeof SOUNDS[keyof typeof SOUNDS];

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private masterVolume: number = 1.0;
  private sfxVolume: number = 1.0;
  private musicVolume: number = 0.5;
  private muted: boolean = false;
  private ambientSound: Howl | null = null;

  constructor(config?: AudioConfig) {
    this.masterVolume = config?.masterVolume ?? 1.0;
    this.sfxVolume = config?.sfxVolume ?? 1.0;
    this.musicVolume = config?.musicVolume ?? 0.5;
    this.muted = config?.muted ?? false;

    // Initialize Howler with master volume
    Howler.volume(this.masterVolume);
    Howler.mute(this.muted);

    // Load sound effects
    this.initializeSounds();
  }

  private initializeSounds(): void {
    // Use silent audio data URLs as placeholders
    // In a production game, these would be actual audio files
    // The Web Audio API generation is complex and can cause issues in test environments
    const silentAudio = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    
    // Shoot sound
    this.sounds.set(SOUNDS.SHOOT, new Howl({
      src: [silentAudio],
      volume: this.sfxVolume,
      preload: true,
    }));

    // Hit sound
    this.sounds.set(SOUNDS.HIT, new Howl({
      src: [silentAudio],
      volume: this.sfxVolume,
      preload: true,
    }));

    // Reload sound
    this.sounds.set(SOUNDS.RELOAD, new Howl({
      src: [silentAudio],
      volume: this.sfxVolume,
      preload: true,
    }));

    // Empty clip sound
    this.sounds.set(SOUNDS.EMPTY, new Howl({
      src: [silentAudio],
      volume: this.sfxVolume,
      preload: true,
    }));

    // Ambient sound (looping)
    this.ambientSound = new Howl({
      src: [silentAudio],
      volume: this.musicVolume,
      loop: true,
      preload: true,
    });
  }


  /**
   * Play a sound effect
   */
  playSound(soundName: SoundName, options?: PlayOptions): void {
    if (this.muted) return;

    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.warn(`Sound "${soundName}" not found`);
      return;
    }

    // Calculate final volume
    let volume = options?.volume ?? this.sfxVolume;
    volume *= this.masterVolume;

    // Play the sound
    const soundId = sound.play();
    if (soundId !== undefined) {
      sound.volume(volume, soundId);
      if (options?.rate) {
        sound.rate(options.rate, soundId);
      }
    }
  }

  /**
   * Stop a sound effect
   */
  stopSound(soundName: SoundName): void {
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.stop();
    }
  }

  /**
   * Start ambient background music
   */
  startAmbient(): void {
    if (this.muted) return;
    if (this.ambientSound && !this.ambientSound.playing()) {
      this.ambientSound.play();
    }
  }

  /**
   * Stop ambient background music
   */
  stopAmbient(): void {
    if (this.ambientSound) {
      this.ambientSound.stop();
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  /**
   * Set SFX volume (0.0 to 1.0)
   */
  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    // Update all SFX sounds
    this.sounds.forEach((sound) => {
      sound.volume(this.sfxVolume);
    });
  }

  /**
   * Set music volume (0.0 to 1.0)
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.ambientSound) {
      this.ambientSound.volume(this.musicVolume);
    }
  }

  /**
   * Mute all sounds
   */
  mute(): void {
    this.muted = true;
    Howler.mute(true);
  }

  /**
   * Unmute all sounds
   */
  unmute(): void {
    this.muted = false;
    Howler.mute(false);
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Get current master volume
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Get current SFX volume
   */
  getSFXVolume(): number {
    return this.sfxVolume;
  }

  /**
   * Get current music volume
   */
  getMusicVolume(): number {
    return this.musicVolume;
  }

  /**
   * Cleanup - stop all sounds and release resources
   */
  cleanup(): void {
    this.stopAmbient();
    this.sounds.forEach((sound) => {
      sound.unload();
    });
    this.sounds.clear();
    Howler.unload();
  }
}

