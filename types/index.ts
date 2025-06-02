export interface VoiceMessage {
  id: string;
  audioBlob: Blob;
  timestamp: number;
  sender: string;
  read?: boolean;
}

export interface RoomData {
  roomId: string;
  peerId: string;
  userId: string;
}

export interface PeerData {
  peerId: string;
  userName: string;
}