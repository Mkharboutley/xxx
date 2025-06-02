import { useEffect, useRef } from 'react';
import useAudioPlayer from '@/hooks/useAudioPlayer';
import type { VoiceMessage } from '@/types';

interface Props {
  message: VoiceMessage;
}

export default function AudioMessage({ message }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioUrl = URL.createObjectURL(message.audioBlob);
  
  const {
    isPlaying,
    duration,
    currentTime,
    audioData,
    togglePlay,
    seek
  } = useAudioPlayer(audioUrl);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (!canvasRef.current || !audioData.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / audioData.length;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#4CAF50';

    audioData.forEach((value, index) => {
      const barHeight = (value / 255) * height;
      const x = index * barWidth;
      const y = height - barHeight;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [audioData]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-message">
      <div className="audio-controls">
        <button onClick={togglePlay} className="play-button">
          {isPlaying ? '⏸' : '▶️'}
        </button>
        
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <div className="progress-bar" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          seek(percent);
        }}>
          <div 
            className="progress" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>
      
      <canvas 
        ref={canvasRef}
        width={300}
        height={50}
        className="audio-visualizer"
      />
    </div>
  );
}