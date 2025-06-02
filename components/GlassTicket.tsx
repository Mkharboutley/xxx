import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { getSocket } from '@/pages/_app';

interface VoiceMessage {
  id: string;
  ticketId: string;
  timestamp: string;
  audioData: string;
  sender: string;
}

export default function GlassTicket({ ticketId, role }: { ticketId: string; role: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const socket = getSocket();

  useEffect(() => {
    if (socket) {
      socket.emit('join', { ticketId, role });
      
      socket.on('voiceMessage', (message: VoiceMessage) => {
        setMessages(prev => [...prev, message]);
      });
    }

    loadMessages();
    return () => cleanup();
  }, [ticketId, socket]);

  const cleanup = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    if (socket) {
      socket.off('voiceMessage');
      socket.emit('leave', { ticketId });
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages/${ticketId}`);
      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load messages');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setAudioStream(stream);

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      
      setMediaRecorder(recorder);
      chunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = handleRecordingStop;
      recorder.start(100);
      
      setIsRecording(true);
      startTimer();
      
      toast.info('Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 60) {
          stopRecording();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop();
      audioStream?.getTracks().forEach(track => track.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
      toast.info('Recording stopped');
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(chunksRef.current, { 
      type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    });
    
    if (audioBlob.size === 0) {
      toast.error('Recording is empty');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      
      const message: VoiceMessage = {
        id: uuidv4(),
        ticketId,
        timestamp: new Date().toISOString(),
        audioData: base64Audio,
        sender: role
      };

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) throw new Error('Failed to save message');

        // Emit the message through socket
        if (socket) {
          socket.emit('sendVoiceMessage', message);
        }

        setMessages(prev => [...prev, message]);
        toast.success('Voice message sent successfully');
      } catch (error) {
        console.error('Error saving message:', error);
        toast.error('Failed to save message');
      }
    };

    reader.onerror = () => {
      console.error('Error reading audio file:', reader.error);
      toast.error('Failed to process audio file');
    };

    reader.readAsDataURL(audioBlob);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-ticket">
      {role === 'client' && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className="voice-btn w-full mb-4"
        >
          {isRecording ? (
            <>
              <span className="recording-dot"></span>
              Stop Recording ({formatTime(recordingTime)})
            </>
          ) : (
            'Record Message'
          )}
        </button>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className="message-item">
            <div className="message-header">
              <span className="message-sender">
                {message.sender === 'client' ? 'Client' : 'Admin'}
              </span>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleString()}
              </span>
            </div>
            <audio 
              src={message.audioData} 
              controls 
              className="w-full mt-2" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}