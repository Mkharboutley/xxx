import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import usePeerConnection from '@/hooks/usePeerConnection';
import useVoiceRecorder from '@/hooks/useVoiceRecorder';
import { v4 as uuidv4 } from 'uuid';
import type { VoiceMessage } from '@/types';

interface Ticket {
  id: string;
  ticket_number: number;
  plate_number: string;
  car_model: string;
  status: string;
  assignedWorker?: string | null;
  etaMinutes?: number;
}

export default function GlassTicket({ ticketId, role }: { ticketId: string; role: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  
  const {
    isRecording,
    recordingDuration,
    audioData,
    startRecording,
    stopRecording,
    cancelRecording,
    resetRecording
  } = useVoiceRecorder();

  const {
    isConnected,
    error: connectionError,
    createRoom,
    joinRoom,
    sendVoiceMessage
  } = usePeerConnection(role);

  useEffect(() => {
    loadTicket();
    initializeRoom();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Failed to load ticket');
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error('Error loading ticket:', err);
      toast.error('Failed to load ticket');
    }
  };

  const initializeRoom = () => {
    if (role === 'admin') {
      const roomData = createRoom();
      // Store room data for clients to join
      localStorage.setItem(`room_${ticketId}`, JSON.stringify(roomData));
    } else {
      const roomData = JSON.parse(localStorage.getItem(`room_${ticketId}`) || '{}');
      if (roomData.roomId) {
        joinRoom(roomData);
      }
    }
  };

  const handleStartRecording = async () => {
    if (!isConnected) {
      toast.error('Voice chat not connected');
      return;
    }
    await startRecording();
  };

  const handleStopRecording = async () => {
    const recordingData = await stopRecording();
    if (recordingData) {
      const message: VoiceMessage = {
        id: uuidv4(),
        audioBlob: recordingData.blob,
        timestamp: Date.now(),
        sender: role
      };
      
      const success = sendVoiceMessage(message);
      if (success) {
        setMessages(prev => [...prev, message]);
        resetRecording();
      }
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!ticket) return null;

  return (
    <div className="glass-ticket">
      <div className="ticket-details">
        <h3>Ticket #{ticket.ticket_number}</h3>
        <p>Plate: {ticket.plate_number}</p>
        <p>Model: {ticket.car_model}</p>
        <p>Status: {ticket.status}</p>
        {ticket.etaMinutes && <p>ETA: {ticket.etaMinutes} minutes</p>}
      </div>

      <div className="voice-chat">
        {connectionError && (
          <div className="error-message">{connectionError}</div>
        )}

        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className="voice-btn"
          disabled={!isConnected}
        >
          {isRecording ? (
            <>
              <span className="recording-dot"></span>
              Stop Recording ({formatTime(recordingDuration)})
            </>
          ) : (
            'Record Message'
          )}
        </button>

        <div className="messages-container">
          {messages.map((message) => (
            <div key={message.id} className="message-item">
              <div className="message-header">
                <span className="message-sender">{message.sender}</span>
                <span className="message-time">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
              <audio src={URL.createObjectURL(message.audioBlob)} controls />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}