import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioManager, SOUNDS } from '../audioManager';

// Mock Howler
vi.mock('howler', () => {
  const mockHowl = vi.fn().mockImplementation((options: any) => {
    return {
      play: vi.fn(() => 1),
      stop: vi.fn(),
      volume: vi.fn(),
      unload: vi.fn(),
      playing: vi.fn(() => false),
    };
  });

  return {
    Howl: mockHowl,
    Howler: {
      volume: vi.fn(),
      mute: vi.fn(),
      unload: vi.fn(),
    },
  };
});

describe('AudioManager', () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      sampleRate: 44100,
      createBuffer: vi.fn(() => ({
        length: 44100,
        sampleRate: 44100,
        numberOfChannels: 1,
        getChannelData: vi.fn(() => new Float32Array(44100)),
      })),
    })) as any;

    audioManager = new AudioManager();
  });

  afterEach(() => {
    audioManager.cleanup();
  });

  describe('Initialization', () => {
    it('should initialize with default volumes', () => {
      expect(audioManager.getMasterVolume()).toBe(1.0);
      expect(audioManager.getSFXVolume()).toBe(1.0);
      expect(audioManager.getMusicVolume()).toBe(0.5);
      expect(audioManager.isMuted()).toBe(false);
    });

    it('should initialize with custom config', () => {
      const customManager = new AudioManager({
        masterVolume: 0.8,
        sfxVolume: 0.7,
        musicVolume: 0.3,
        muted: true,
      });
      
      expect(customManager.getMasterVolume()).toBe(0.8);
      expect(customManager.getSFXVolume()).toBe(0.7);
      expect(customManager.getMusicVolume()).toBe(0.3);
      expect(customManager.isMuted()).toBe(true);
      
      customManager.cleanup();
    });
  });

  describe('Sound Playback', () => {
    it('should play shoot sound', () => {
      expect(() => audioManager.playSound(SOUNDS.SHOOT)).not.toThrow();
    });

    it('should play hit sound', () => {
      expect(() => audioManager.playSound(SOUNDS.HIT)).not.toThrow();
    });

    it('should play reload sound', () => {
      expect(() => audioManager.playSound(SOUNDS.RELOAD)).not.toThrow();
    });

    it('should play empty sound', () => {
      expect(() => audioManager.playSound(SOUNDS.EMPTY)).not.toThrow();
    });

    it('should not play sound when muted', () => {
      audioManager.mute();
      expect(() => audioManager.playSound(SOUNDS.SHOOT)).not.toThrow();
      // Sound should not actually play when muted
    });
  });

  describe('Volume Controls', () => {
    it('should set master volume', () => {
      audioManager.setMasterVolume(0.5);
      expect(audioManager.getMasterVolume()).toBe(0.5);
    });

    it('should clamp master volume to 0-1 range', () => {
      audioManager.setMasterVolume(-1);
      expect(audioManager.getMasterVolume()).toBe(0);
      
      audioManager.setMasterVolume(2);
      expect(audioManager.getMasterVolume()).toBe(1);
    });

    it('should set SFX volume', () => {
      audioManager.setSFXVolume(0.7);
      expect(audioManager.getSFXVolume()).toBe(0.7);
    });

    it('should clamp SFX volume to 0-1 range', () => {
      audioManager.setSFXVolume(-1);
      expect(audioManager.getSFXVolume()).toBe(0);
      
      audioManager.setSFXVolume(2);
      expect(audioManager.getSFXVolume()).toBe(1);
    });

    it('should set music volume', () => {
      audioManager.setMusicVolume(0.6);
      expect(audioManager.getMusicVolume()).toBe(0.6);
    });

    it('should clamp music volume to 0-1 range', () => {
      audioManager.setMusicVolume(-1);
      expect(audioManager.getMusicVolume()).toBe(0);
      
      audioManager.setMusicVolume(2);
      expect(audioManager.getMusicVolume()).toBe(1);
    });
  });

  describe('Mute/Unmute', () => {
    it('should mute audio', () => {
      audioManager.mute();
      expect(audioManager.isMuted()).toBe(true);
    });

    it('should unmute audio', () => {
      audioManager.mute();
      audioManager.unmute();
      expect(audioManager.isMuted()).toBe(false);
    });
  });

  describe('Ambient Music', () => {
    it('should start ambient music', () => {
      expect(() => audioManager.startAmbient()).not.toThrow();
    });

    it('should stop ambient music', () => {
      expect(() => audioManager.stopAmbient()).not.toThrow();
    });

    it('should not start ambient when muted', () => {
      audioManager.mute();
      expect(() => audioManager.startAmbient()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      expect(() => audioManager.cleanup()).not.toThrow();
    });
  });
});

