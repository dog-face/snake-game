import { useState, useEffect, useRef } from 'react';
import { AudioManager } from '../../../utils/games/fps/audioManager';

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  isMuted: boolean;
}

/**
 * Custom hook for managing FPS game audio settings
 */
export function useFPSAudio() {
  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('fps-master-volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  
  const [sfxVolume, setSFXVolume] = useState(() => {
    const saved = localStorage.getItem('fps-sfx-volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('fps-music-volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('fps-muted');
    return saved === 'true';
  });
  
  const audioManagerRef = useRef<AudioManager | null>(null);
  
  // Initialize audio manager
  useEffect(() => {
    audioManagerRef.current = new AudioManager({
      masterVolume,
      sfxVolume,
      musicVolume,
      muted: isMuted,
    });
    
    return () => {
      audioManagerRef.current?.cleanup();
    };
  }, []);
  
  // Update audio settings when they change
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMasterVolume(masterVolume);
      localStorage.setItem('fps-master-volume', masterVolume.toString());
    }
  }, [masterVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setSFXVolume(sfxVolume);
      localStorage.setItem('fps-sfx-volume', sfxVolume.toString());
    }
  }, [sfxVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMusicVolume(musicVolume);
      localStorage.setItem('fps-music-volume', musicVolume.toString());
    }
  }, [musicVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      if (isMuted) {
        audioManagerRef.current.mute();
      } else {
        audioManagerRef.current.unmute();
      }
      localStorage.setItem('fps-muted', isMuted.toString());
    }
  }, [isMuted]);
  
  return {
    audioManager: audioManagerRef.current,
    masterVolume,
    setMasterVolume,
    sfxVolume,
    setSFXVolume,
    musicVolume,
    setMusicVolume,
    isMuted,
    setIsMuted,
  };
}

