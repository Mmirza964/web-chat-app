import * as express from 'express';
import { Server } from 'socket.io';
import * as http from 'http';
import * as cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5174',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-queue', ({ name }) => {
    console.log(`${name} joined the queue.`);
    socket.join('waiting-room');

    const clients = Array.from(
      io.sockets.adapter.rooms.get('waiting-room') || []
    );
    if (clients.length >= 2) {
      const [user1, user2] = clients;
      const roomId = `room-${user1}-${user2}`;

      io.to(user1).emit('matched', { roomId, isInitiator: true });
      io.to(user2).emit('matched', { roomId, isInitiator: false });

      io.sockets.sockets.get(user1)?.leave('waiting-room');
      io.sockets.sockets.get(user2)?.leave('waiting-room');
    }
  });

  socket.on('offer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('offer', { roomId, sdp });
  });

  socket.on('answer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('answer', { sdp });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
