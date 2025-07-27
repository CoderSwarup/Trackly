import { Server } from 'socket.io';

const socketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Define socket events
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Example event
    socket.on('message', (msg) => {
      console.log('Message received:', msg);
      io.emit('message', msg); // Broadcast message to all clients
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

export default socketServer;