import { useState, useRef, useCallback, useEffect } from 'react';

const useAudioPlayer = (audioUrl: string) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Set up audio player and analyzer
  useEffect(() => {
    if (!audioUrl) return;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration * 1000); // convert to ms
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime * 1000); // convert to ms
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
      stopVisualization();
    });
    
    // Set up audio analyzer
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);
  
  const updateAudioData = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    setAudioData(dataArray);
    
    animationRef.current = requestAnimationFrame(updateAudioData);
  };
  
  const startVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(updateAudioData);
  };
  
  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      stopVisualization();
    } else {
      audioRef.current.play();
      startVisualization();
      
      // If audio context is suspended (e.g., by browser policy), resume it
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
    
    setIsPlaying(!isPlaying);
  }, [isPlaying]);
  
  const seek = useCallback((percent: number) => {
    if (!audioRef.current) return;
    
    const seekTime = (percent / 100) * (audioRef.current.duration || 0);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime * 1000);
  }, []);
  
  return {
    isPlaying,
    duration,
    currentTime,
    audioData,
    togglePlay,
    seek
  };
};

export default useAudioPlayer;