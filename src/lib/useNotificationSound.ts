import { useState, useEffect, useCallback } from 'react';

export const useNotificationSound = (soundUrl: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We need to create the Audio object once the component is mounted
    // to avoid issues with server-side rendering.
    const audioInstance = new Audio(soundUrl);
    audioInstance.load(); // Pre-load the audio
    setAudio(audioInstance);
  }, [soundUrl]);

  const playSound = useCallback(() => {
    if (document.hidden && audio) {
      audio.play().catch(error => {
        // Autoplay was prevented.
        console.error("Audio playback error:", error);
      });
    }
  }, [audio]);

  return { playSound };
};