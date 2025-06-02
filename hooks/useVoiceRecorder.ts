import { useState, useRef, useCallback } from 'react';

const useVoiceRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioData, setAudioData] = useState<{ blob: Blob; url: string } | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.start(100);
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve();
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioData({ blob: audioBlob, url: audioUrl });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }

        setIsRecording(false);
        resolve();
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording]);
  
  return {
    isRecording,
    recordingDuration,
    audioData,
    startRecording,
    stopRecording
  };
};

export default useVoiceRecorder;