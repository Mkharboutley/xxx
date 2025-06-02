import { Server } from 'socket.io';

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    console.log('**** Starting socket.io server... ****');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      pingTimeout: 60000,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      const { ticketId, role } = socket.handshake.query;
      const room = `ticket-${ticketId}`;
      
      console.log(`Socket connected - Role: ${role}, Room: ${room}`);
      
      // Join the ticket-specific room
      socket.join(room);
      console.log(`${role} joined room: ${room}`);

      // Handle voice messages
      socket.on('sendVoiceMessage', (message) => {
        console.log(`Received voice message from ${role} in room ${room}`);
        console.log('Broadcasting message to room members...');
        
        // Broadcast to all clients in the room
        io.to(room).emit('voiceMessage', message);
        console.log('Message broadcast complete');
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`${role} disconnected from ${room}`);
        socket.leave(room);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${role} in ${room}:`, error);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server is already running');
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;