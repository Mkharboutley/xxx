import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Input from '@/components/Input';

interface Props {
  username: string;
  peerId: string;
  onJoinRoom: (roomData: { roomId: string; peerId: string }) => void;
  onBack: () => void;
  isConnecting: boolean;
  error: string | null;
}

export default function JoinRoom({
  username,
  peerId,
  onJoinRoom,
  onBack,
  isConnecting,
  error
}: Props) {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoinRoom({ roomId: roomId.trim(), peerId });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <h2 className="text-xl font-semibold text-gray-200 mb-4">Join Room</h2>
        
        <Input
          placeholder="Enter room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          fullWidth
          className="mb-4"
        />

        {error && (
          <p className="text-red-500 mb-4">{error}</p>
        )}

        <button
          onClick={handleJoin}
          disabled={!roomId.trim() || isConnecting}
          className={`
            w-full py-3 rounded-lg font-medium transition-colors
            ${roomId.trim() && !isConnecting
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
          `}
        >
          {isConnecting ? 'Connecting...' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}