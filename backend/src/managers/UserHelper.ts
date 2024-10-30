import { Socket } from 'socket.io';
import { RoomHelper } from './RoomHelper';

export interface User {
  socket: Socket;
  name: string;
}

export class UserHelper {
  private users: User[];
  private queue: string[];
  private roomManager: RoomHelper;

  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomHelper();
  }

  registerUser(name: string, socket: Socket) {
    this.users.push({
      name,
      socket,
    });
    this.queue.push(socket.id);
    socket.send('lobby');
    this.clearQueue();
    this.initializeHandler(socket);
  }

  deregisterUser(socketId: string) {
    const user = this.users.find((x) => x.socket.id === socketId);
    this.users = this.users.filter((x) => x.socket.id !== socketId);
    this.queue = this.queue.filter((x) => x === socketId);
  }

  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }

    const id1 = this.queue.pop();
    const id2 = this.queue.pop();

    const user1 = this.users.find((x) => x.socket.id === id1);
    const user2 = this.users.find((x) => x.socket.id === id2);

    if (!user1 || !user2) {
      return;
    }

    const room = this.roomManager.createRoom(user1, user2);
    this.clearQueue();
  }

  initializeHandler(socket: Socket) {
    socket.on('offer', ({ sdp, roomId }: { sdp: string; roomId: string }) => {
      this.roomManager.newRoomOnOffer(roomId, sdp);
    });

    socket.on('answer', ({ sdp, roomId }: { sdp: string; roomId: string }) => {
      this.roomManager.newRoomOnOffer(roomId, sdp);
    });
  }
}
