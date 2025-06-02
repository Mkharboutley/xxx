import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import usePeerConnection from '@/hooks/usePeerConnection';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import AudioMessage from '@/components/AudioMessage';
import VoiceRecorder from '@/components/VoiceRecorder';
import type { VoiceMessage } from '@/types';

interface Props {
  ticketId: string;
  role: string;
}

export default function GlassTicket({ ticketId, role }: Props) {
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  
  const {
    isConnected,
    error: connectionError,
    createRoom,
    joinRoom,
    sendVoiceMessage
  } = usePeerConnection(role);

  useEffect(() => {
    initializeVoiceChat();
  }, [ticketId]);

  const initializeVoiceChat = () => {
    if (role === 'admin') {
      const roomData = createRoom();
      localStorage.setItem(`voiceRoom_${ticketId}`, JSON.stringify(roomData));
    } else {
      const roomData = JSON.parse(localStorage.getItem(`voiceRoom_${ticketId}`) || '{}');
      if (roomData.roomId) {
        joinRoom(roomData);
      }
    }
  };

  const handleSendVoiceMessage = (audioBlob: Blob, duration: number) => {
    if (!isConnected) {
      toast.error('Voice chat not connected');
      return;
    }

    const message: VoiceMessage = {
      id: crypto.randomUUID(),
      audioBlob,
      timestamp: Date.now(),
      sender: role
    };

    const success = sendVoiceMessage(message);
    if (success) {
      setMessages(prev => [...prev, message]);
    }
  };

  return (
    <div className="glass-ticket">
      {connectionError && (
        <div className="error-message">{connectionError}</div>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <AudioMessage key={message.id} message={message} />
        ))}
      </div>

      <VoiceRecorder onSend={handleSendVoiceMessage} />
    </div>
  );
}