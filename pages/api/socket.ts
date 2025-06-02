import { Server } from 'socket.io';

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
    console.log('Starting socket.io server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      const { ticketId, role } = socket.handshake.query;
      const room = `ticket-${ticketId}`;
      
      console.log(`${role} connecting to ${room}`);
      
      socket.join(room);
      console.log(`${role} joined ${room}`);

      socket.on('sendVoiceMessage', (message) => {
        console.log(`Broadcasting voice message to ${room}`);
        io.to(room).emit('voiceMessage', message);
      });

      socket.on('disconnect', () => {
        console.log(`${role} left ${room}`);
        socket.leave(room);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.io server already running');
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;