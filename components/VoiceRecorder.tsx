import React, { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import { formatDuration } from '@/utils/time';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend }) => {
  const {
    isRecording,
    recordingDuration,
    audioData,
    startRecording,
    stopRecording,
    cancelRecording,
    getVisualizationData,
    resetRecording,
  } = useVoiceRecorder();
  
  const [visualizationData, setVisualizationData] = useState<Uint8Array>(new Uint8Array(0));
  
  // Update visualization data when recording
  useEffect(() => {
    if (!isRecording) return;
    
    const updateVisualization = () => {
      const data = getVisualizationData();
      setVisualizationData(data);
      requestAnimationFrame(updateVisualization);
    };
    
    const animationId = requestAnimationFrame(updateVisualization);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isRecording, getVisualizationData]);
  
  const handleStartRecording = async () => {
    await startRecording();
  };
  
  const handleStopRecording = async () => {
    const data = await stopRecording();
    if (data && data.blob) {
      onSend(data.blob, recordingDuration);
      resetRecording();
    }
  };
  
  const handleCancelRecording = () => {
    cancelRecording();
  };
  
  return (
    <div className="relative flex items-center justify-center">
      {isRecording ? (
        <div className="flex items-center space-x-2 bg-gray-800 rounded-full p-2">
          <button
            onClick={handleCancelRecording}
            className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Cancel recording"
          >
            <X size={18} />
          </button>
          
          <div className="w-32 h-8 flex items-center justify-center">
            <div className="w-full h-full relative">
              {Array.from(visualizationData).map((value, index) => (
                <div
                  key={index}
                  className="absolute bottom-0 bg-blue-500"
                  style={{
                    left: `${(index / visualizationData.length) * 100}%`,
                    width: `${100 / visualizationData.length}%`,
                    height: `${(value / 255) * 100}%`,
                    opacity: 0.7
                  }}
                />
              ))}
            </div>
          </div>
          
          <div className="text-xs font-mono text-gray-300 w-12">
            {formatDuration(recordingDuration)}
          </div>
          
          <button
            onClick={handleStopRecording}
            className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <span className="w-3 h-3 bg-white rounded-sm" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleStartRecording}
          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md"
          aria-label="Record voice message"
        >
          <Mic size={20} />
        </button>
      )}
    </div>
  );
};

export default VoiceRecorder;