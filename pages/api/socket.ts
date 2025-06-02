import { Server } from 'socket.io';

const ioHandler = (req: any, res: any) => {
  if (!res.socket.server.io) {
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
      
      socket.join(`ticket-${ticketId}`);
      console.log(`${role} joined ticket-${ticketId}`);

      socket.on('sendVoiceMessage', (message) => {
        io.to(`ticket-${ticketId}`).emit('voiceMessage', message);
      });

      socket.on('disconnect', () => {
        socket.leave(`ticket-${ticketId}`);
        console.log(`${role} left ticket-${ticketId}`);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
};

export const config = {
  api: {
    bodyParser: false
  }
};

export default ioHandler;