import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFPSAudio } from '../useFPSAudio';

// Mock AudioManager
vi.mock('../../../../utils/games/fps/audioManager', () => ({
  AudioManager: vi.fn().mockImplementation(() => ({
    setMasterVolume: vi.fn(),
    setSFXVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    mute: vi.fn(),
    unmute: vi.fn(),
    cleanup: vi.fn(),
  })),
  SOUNDS: {},
}));

describe('useFPSAudio', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should initialize with default audio settings', () => {
    const { result } = renderHook(() => useFPSAudio());
    
    expect(result.current.masterVolume).toBe(1.0);
    expect(result.current.sfxVolume).toBe(1.0);
    expect(result.current.musicVolume).toBe(0.5);
    expect(result.current.isMuted).toBe(false);
  });
  
  it('should load audio settings from localStorage', () => {
    localStorage.setItem('fps-master-volume', '0.8');
    localStorage.setItem('fps-sfx-volume', '0.6');
    localStorage.setItem('fps-music-volume', '0.3');
    localStorage.setItem('fps-muted', 'true');
    
    const { result } = renderHook(() => useFPSAudio());
    
    expect(result.current.masterVolume).toBe(0.8);
    expect(result.current.sfxVolume).toBe(0.6);
    expect(result.current.musicVolume).toBe(0.3);
    expect(result.current.isMuted).toBe(true);
  });
  
  it('should update master volume and save to localStorage', () => {
    const { result } = renderHook(() => useFPSAudio());
    
    act(() => {
      result.current.setMasterVolume(0.7);
    });
    
    expect(result.current.masterVolume).toBe(0.7);
    expect(localStorage.getItem('fps-master-volume')).toBe('0.7');
  });
  
  it('should update SFX volume and save to localStorage', () => {
    const { result } = renderHook(() => useFPSAudio());
    
    act(() => {
      result.current.setSFXVolume(0.9);
    });
    
    expect(result.current.sfxVolume).toBe(0.9);
    expect(localStorage.getItem('fps-sfx-volume')).toBe('0.9');
  });
  
  it('should update music volume and save to localStorage', () => {
    const { result } = renderHook(() => useFPSAudio());
    
    act(() => {
      result.current.setMusicVolume(0.4);
    });
    
    expect(result.current.musicVolume).toBe(0.4);
    expect(localStorage.getItem('fps-music-volume')).toBe('0.4');
  });
  
  it('should toggle mute state', () => {
    const { result } = renderHook(() => useFPSAudio());
    
    act(() => {
      result.current.setIsMuted(true);
    });
    
    expect(result.current.isMuted).toBe(true);
    expect(localStorage.getItem('fps-muted')).toBe('true');
    
    act(() => {
      result.current.setIsMuted(false);
    });
    
    expect(result.current.isMuted).toBe(false);
    expect(localStorage.getItem('fps-muted')).toBe('false');
  });
});

