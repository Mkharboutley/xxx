import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import CreateRoom from './components/Room/CreateRoom';
import JoinRoom from './components/Room/JoinRoom';
import ChatRoom from './components/Chat/ChatRoom';
import Input from './components/UI/Input';
import usePeerConnection from './hooks/usePeerConnection';

function App() {
  const [username, setUsername] = useState('');
  const [showUsernameInput, setShowUsernameInput] = useState(true);
  const [view, setView] = useState<'welcome' | 'create' | 'join' | 'chat'>('welcome');
  
  const {
    roomId,
    userId,
    peerId,
    isConnected,
    isConnecting,
    error,
    remotePeer,
    createRoom,
    joinRoom,
    sendVoiceMessage,
    markMessageAsRead,
    disconnectFromRoom,
    connection
  } = usePeerConnection(username);
  
  useEffect(() => {
    if (isConnected) {
      setView('chat');
    }
  }, [isConnected]);
  
  const handleSetUsername = () => {
    if (username.trim()) {
      setShowUsernameInput(false);
    }
  };
  
  if (showUsernameInput) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <MessageCircle size={32} className="text-blue-400 mr-2" />
            <h1 className="text-2xl font-bold text-white">Voice Chat</h1>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-200 mb-4">What's your name?</h2>
          
          <Input
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            className="mb-4"
          />
          
          <button
            onClick={handleSetUsername}
            disabled={!username.trim()}
            className={`
              w-full py-2 rounded-lg font-medium transition-colors
              ${username.trim() 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}
            `}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {view === 'welcome' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <MessageCircle size={32} className="text-blue-400 mr-2" />
              <h1 className="text-2xl font-bold text-white">Voice Chat</h1>
            </div>
            
            <p className="text-gray-300 mb-6 text-center">
              Hi, {username}! Create a room or join an existing one to start voice chatting.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => setView('create')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Create a Room
              </button>
              
              <button
                onClick={() => setView('join')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Join a Room
              </button>
            </div>
          </div>
        </div>
      )}
      
      {view === 'create' && (
        <CreateRoom
          username={username}
          onCreateRoom={createRoom}
          onJoin={() => setView('chat')}
        />
      )}
      
      {view === 'join' && (
        <JoinRoom
          username={username}
          peerId={peerId}
          onJoinRoom={joinRoom}
          onBack={() => setView('welcome')}
          isConnecting={isConnecting}
          error={error}
        />
      )}
      
      {view === 'chat' && (
        <ChatRoom
          userId={userId}
          roomId={roomId}
          remotePeer={remotePeer}
          connection={connection}
          onLeaveRoom={() => {
            disconnectFromRoom();
            setView('welcome');
          }}
          onSendVoiceMessage={sendVoiceMessage}
          onMarkMessageAsRead={markMessageAsRead}
        />
      )}
    </div>
  );
}

export default App;