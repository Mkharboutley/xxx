import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import io from 'socket.io-client';

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
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Initialize socket server
        await fetch('/api/socket');
        
        // Create socket connection
        socketRef.current = io({
          path: '/api/socket',
          query: { ticketId, role },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });

        // Socket event handlers
        socketRef.current.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
          toast.success('Connected to chat server');
        });

        socketRef.current.on('voiceMessage', (message: VoiceMessage) => {
          console.log('Received voice message:', message.id);
          setMessages(prev => {
            // Avoid duplicate messages
            if (prev.some(m => m.id === message.id)) {
              return prev;
            }
            return [...prev, message];
          });
          
          if (role === 'admin' && message.sender === 'client') {
            toast.info('New voice message from client!');
          }
        });

        socketRef.current.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          setIsConnected(false);
          toast.error('Connection error. Trying to reconnect...');
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
          toast.warn('Disconnected from chat server');
        });

        socketRef.current.on('reconnect', (attemptNumber: number) => {
          console.log('Reconnected after', attemptNumber, 'attempts');
          setIsConnected(true);
          toast.success('Reconnected to chat server');
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        toast.error('Failed to connect to chat server');
      }
    };

    initializeSocket();

    return () => {
      cleanup();
    };
  }, [ticketId, role]);

  const cleanup = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
  };

  const startRecording = async () => {
    if (!isConnected) {
      toast.error('Not connected to chat server');
      return;
    }

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
    if (!isConnected) {
      toast.error('Not connected to chat server. Message will not be sent.');
      return;
    }

    const audioBlob = new Blob(chunksRef.current, { 
      type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    });
    
    if (audioBlob.size === 0) {
      toast.error('Recording is empty');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result as string;
      
      const message: VoiceMessage = {
        id: uuidv4(),
        ticketId,
        timestamp: new Date().toISOString(),
        audioData: base64Audio,
        sender: role
      };

      // Send message through socket
      console.log('Sending voice message:', message.id);
      socketRef.current.emit('sendVoiceMessage', message);
      
      // Add to local messages
      setMessages(prev => [...prev, message]);
      
      if (role === 'client') {
        toast.success('Voice message sent to admin');
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
          disabled={!isConnected}
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