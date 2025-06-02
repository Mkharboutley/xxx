import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';

interface VoiceMessage {
  id: string;
  ticketId: string;
  timestamp: string;
  audioBlob: Blob;
  sender: string;
}

export default function GlassTicket({ ticketId, role }: { ticketId: string; role: string }) {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const socketRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: { ticketId, role }
    });

    // Listen for new voice messages
    socketRef.current.on('voiceMessage', (message: VoiceMessage) => {
      setMessages(prev => [...prev, message]);
      if (role === 'admin') {
        toast.info('New voice message received!');
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      cleanup();
    };
  }, [ticketId, role]);

  const cleanup = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
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

      const recorder = new MediaRecorder(stream);
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
    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    if (audioBlob.size === 0) {
      toast.error('Recording is empty');
      return;
    }

    const message: VoiceMessage = {
      id: uuidv4(),
      ticketId,
      timestamp: new Date().toISOString(),
      audioBlob,
      sender: role
    };

    // Send message through socket
    socketRef.current.emit('sendVoiceMessage', message);
    
    // Add to local messages
    setMessages(prev => [...prev, message]);
    
    if (role === 'client') {
      toast.success('Voice message sent to admin');
    }
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
              src={URL.createObjectURL(message.audioBlob)} 
              controls 
              className="w-full mt-2" 
            />
          </div>
        ))}
      </div>
    </div>
  );
}