import React from 'react';
import { RoomData } from '@/types';

interface Props {
  username: string;
  onCreateRoom: () => RoomData;
  onJoin: () => void;
}

export default function CreateRoom({ username, onCreateRoom, onJoin }: Props) {
  const handleCreate = () => {
    onCreateRoom();
    onJoin();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Create Room</h2>
        <p className="text-gray-300 mb-6">
          Create a new room as {username}
        </p>
        <button
          onClick={handleCreate}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}