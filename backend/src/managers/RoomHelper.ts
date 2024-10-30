import { User } from './UserHelper';

let GLOBAL_ROOM_ID = 1;

interface Room {
  user1: User;
  user2: User;
}

export class RoomHelper {
  private rooms: Map<string, Room>;
  constructor() {
    this.rooms = new Map<string, Room>();
  }

  createRoom(user1: User, user2: User) {
    const roomId = this.generate().toString();
    this.rooms.set(roomId.toString(), {
      user1,
      user2,
    });

    user1.socket.emit('send-offer', {
      roomId,
    });

    user2.socket.emit('send-offer', {
      roomId,
    });
  }

  newRoomOnOffer(roomId: string, sdp: string) {
    const user2 = this.rooms.get(roomId)?.user1;
    user2?.socket.emit('offer', {
      sdp,
      roomId,
    });
  }
  spendAnswer(roomId: string, sdp: string, sendingSocketId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }
    const receivingUser =
      room.user1.socket.id === sendingSocketId ? room.user2 : room.user1;
    receivingUser?.socket.emit('answer', {
      sdp,
      roomId,
    });
  }

  relayIceCandidate(
    roomId: string,
    sendingSocketId: string,
    candidate: any,
    type: 'sender' | 'receiver'
  ) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return;
    }

    const receivingUser =
      room.user1.socket.id === sendingSocketId ? room.user2 : room.user1;
    receivingUser.socket.emit('add-ice-candidate', { candidate, type });
  }

  generate() {
    return GLOBAL_ROOM_ID++;
  }
}
