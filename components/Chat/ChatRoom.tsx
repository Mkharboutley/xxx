import React from 'react';
import { LogOut } from 'lucide-react';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioMessage from '@/components/AudioMessage';
import type { VoiceMessage, PeerData } from '@/types';

interface Props {
  userId: string;
  roomId: string;
  remotePeer: PeerData | null;
  connection: any;
  onLeaveRoom: () => void;
  onSendVoiceMessage: (message: VoiceMessage) => boolean;
  onMarkMessageAsRead: (messageId: string) => void;
}

export default function ChatRoom({
  userId,
  roomId,
  remotePeer,
  connection,
  onLeaveRoom,
  onSendVoiceMessage,
  onMarkMessageAsRead
}: Props) {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <header className="bg-gray-800 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Room: {roomId}</h2>
          {remotePeer && (
            <p className="text-gray-400 text-sm">
              Connected with {remotePeer.userName}
            </p>
          )}
        </div>
        
        <button
          onClick={onLeaveRoom}
          className="flex items-center text-gray-400 hover:text-white"
        >
          <LogOut size={20} className="mr-2" />
          Leave Room
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {connection?.messages?.map((message: VoiceMessage) => (
          <AudioMessage
            key={message.id}
            message={message}
            onRead={() => onMarkMessageAsRead(message.id)}
          />
        ))}
      </div>

      <footer className="bg-gray-800 p-4">
        <VoiceRecorder
          onSend={(audioBlob, duration) => {
            const message: VoiceMessage = {
              id: crypto.randomUUID(),
              audioBlob,
              timestamp: Date.now(),
              sender: userId
            };
            onSendVoiceMessage(message);
          }}
        />
      </footer>
    </div>
  );
}