import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import { v4 as uuidv4 } from 'uuid';

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
  
  const {
    isRecording: recorderIsRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    audioData
  } = useVoiceRecorder();

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const loadMessages = () => {
    try {
      const recordings = JSON.parse(localStorage.getItem('voiceRecordings') || '[]');
      const ticketMessages = recordings
        .filter((r: VoiceMessage) => r.ticketId === ticketId)
        .slice(-5);
      setMessages(ticketMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      setRecordingTime(0);
      toast.info('Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Failed to start recording');
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      setIsRecording(false);
      
      if (audioData?.url) {
        const message: VoiceMessage = {
          id: uuidv4(),
          ticketId,
          timestamp: new Date().toISOString(),
          audioData: audioData.url,
          sender: role
        };

        const allRecordings = JSON.parse(localStorage.getItem('voiceRecordings') || '[]');
        const otherRecordings = allRecordings.filter((r: VoiceMessage) => r.ticketId !== ticketId);
        const ticketMessages = [...messages, message].slice(-5);
        
        localStorage.setItem('voiceRecordings', JSON.stringify([...otherRecordings, ...ticketMessages]));
        setMessages(ticketMessages);

        if (role === 'client') {
          localStorage.setItem('adminTicketSync', JSON.stringify({
            ticketId,
            timestamp: message.timestamp
          }));
          toast.success('Voice message sent');
        }
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      toast.error('Failed to save recording');
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
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className="voice-btn w-full mb-4"
        >
          {isRecording ? (
            <>
              <span className="recording-dot"></span>
              Stop Recording ({formatTime(recordingDuration / 1000)})
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
            <audio src={message.audioData} controls className="w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}