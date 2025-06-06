import { useState, useEffect, useCallback, useRef } from 'react';
import Peer from 'peerjs';
import { v4 as uuidv4 } from 'uuid';
import type { VoiceMessage, RoomData, PeerData } from '../types';

const usePeerConnection = (username: string) => {
  const [roomId, setRoomId] = useState<string>('');
  const [userId] = useState<string>(uuidv4());
  const [peerId, setPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [remotePeer, setRemotePeer] = useState<PeerData | null>(null);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<any>(null);
  
  useEffect(() => {
    const peer = new Peer(undefined, {
      host: '0.peerjs.com',
      secure: true,
      port: 443,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });
    
    peer.on('open', (id) => {
      setPeerId(id);
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnecting(false);
    });
    
    peerRef.current = peer;
    
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
      peer.destroy();
    };
  }, []);
  
  const createRoom = useCallback(() => {
    const newRoomId = uuidv4().substring(0, 8);
    setRoomId(newRoomId);
    return { roomId: newRoomId, userId, peerId };
  }, [userId, peerId]);
  
  const joinRoom = useCallback((roomData: RoomData) => {
    if (!peerRef.current || !roomData.peerId) {
      setError('Cannot connect: Peer connection not established');
      return;
    }
    
    setIsConnecting(true);
    setRoomId(roomData.roomId);
    
    try {
      const conn = peerRef.current.connect(roomData.peerId);
      connectionRef.current = conn;
      
      conn.on('open', () => {
        setIsConnected(true);
        setIsConnecting(false);
        
        conn.send({
          type: 'USER_INFO',
          payload: { 
            peerId: peerId,
            userName: username
          }
        });
      });
      
      conn.on('data', (data: any) => {
        if (data.type === 'USER_INFO') {
          setRemotePeer(data.payload);
        }
      });
      
      conn.on('close', () => {
        setIsConnected(false);
        setRemotePeer(null);
      });
      
      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setError(`Connection error: ${err.message}`);
        setIsConnecting(false);
      });
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnecting(false);
    }
  }, [peerId, username]);
  
  const sendVoiceMessage = useCallback((message: VoiceMessage) => {
    if (!connectionRef.current || !isConnected) {
      setError('Cannot send message: Not connected to peer');
      return false;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        connectionRef.current.send({
          type: 'VOICE_MESSAGE',
          payload: {
            ...message,
            sent: true,
            audioBlob: arrayBuffer
          }
        });
      };
      reader.readAsArrayBuffer(message.audioBlob);
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, [isConnected]);
  
  return {
    roomId,
    userId,
    peerId,
    isConnected,
    isConnecting,
    error,
    remotePeer,
    createRoom,
    joinRoom,
    sendVoiceMessage
  };
};

export default usePeerConnection;