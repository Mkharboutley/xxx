import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioData: Uint8Array;
  color?: string;
  height?: number;
  animated?: boolean;
  barWidth?: number;
  barSpacing?: number;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioData,
  color = '#60A5FA',
  height = 24,
  animated = true,
  barWidth = 2,
  barSpacing = 1
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const totalBars = Math.floor(canvas.width / (barWidth + barSpacing));
      const dataStep = Math.ceil(audioData.length / totalBars);
      
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = i * dataStep;
        const value = audioData[dataIndex] || 0;
        
        const barHeight = (value / 255) * height;
        const x = i * (barWidth + barSpacing);
        const y = (height - barHeight) / 2;
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
      }
      
      if (animated) {
        requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animated) {
        cancelAnimationFrame(draw as any);
      }
    };
  }, [audioData, color, height, animated, barWidth, barSpacing]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={height}
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'block'
      }}
    />
  );
};

export default AudioVisualizer;