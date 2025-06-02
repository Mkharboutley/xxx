import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on('broadcast', { event: 'voice_message' }, ({ payload }) => {
        console.log('Received voice message:', payload);
        setMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
        
        if (role === 'admin' && payload.sender === 'client') {
          toast.info('New voice message from client!');
        }
      })
      .subscribe();

    // Load existing messages
    loadMessages();

    return () => {
      cleanup();
      channel.unsubscribe();
    };
  }, [ticketId, role]);

  const loadMessages = async () => {
    try {
      const { data: messages } = await supabase
        .from('voice_messages')
        .select('*')
        .eq('ticketId', ticketId)
        .order('timestamp', { ascending: true });

      if (messages) {
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

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
        // Save to Supabase
        const { error } = await supabase
          .from('voice_messages')
          .insert(message);

        if (error) throw error;

        // Broadcast to channel
        await supabase
          .channel(`ticket-${ticketId}`)
          .send({
            type: 'broadcast',
            event: 'voice_message',
            payload: message
          });

        // Add to local messages
        setMessages(prev => [...prev, message]);
        
        if (role === 'client') {
          toast.success('Voice message sent to admin');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
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