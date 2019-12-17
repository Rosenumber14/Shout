const uuid = require('uuid');
const RoomKeeper = require('./roomKeeper');

const roomKeeper = new RoomKeeper();
const userRoomKeeper = new RoomKeeper();

const MAX_CONNECTIONS_PER_USER = 10;

const roomNamePrefixs = {
  NAME: 'name_'
}
class SocketRoomsHelper {
  // ////////////////***************CLOSE***************////////////////
  closeRoom(io, roomId) {
    roomKeeper.closeRoom(io, roomId);
  }
  // ////////////////***************CLOSE***************////////////////

  // ////////////////***************EMITS***************////////////////
  emitToRoom(io, roomId, event, dataToStringify) {
    const room = getRoomName(roomId);
    return roomKeeper.emit(io, roomId, room, event, dataToStringify);
  }

  emitToUserRoom(io, userId, event, dataToStringify) {
    const room = getRoomName(null, null, userId);
    return userRoomKeeper.emit(io, userId, room, event, dataToStringify);
  }
  // ////////////////***************EMITS***************////////////////

  handleDisconnect(io, socket) {
    roomKeeper.handleDisconnect(io, socket);
    userRoomKeeper.handleDisconnect(io, socket);
  }

  // ////////////////***************IS IN ROOM***************////////////////
  isSocketInRoom(socket, roomId) {
    return this._isSocketInRoom(socket, getRoomName(roomId));
  }

  _isSocketInRoom(socket, room) {
    return !!socket.rooms[room];
  }
  // ////////////////***************IS IN ROOM***************////////////////

  // ////////////////***************JOINS***************////////////////
  joinRoom(io, socket, roomId, user) {
    const roomName = getRoomName(roomId);
    roomKeeper.leaveDuplicateRooms(io, socket, roomNamePrefixs.ROOM);
    roomKeeper.joinRoom(io, socket, roomId, roomName, user);
    socket.emit('joined-room', JSON.stringify({ room: { id: roomId } }));
  }

  disconnectFirstSocketUntilClientsLengthIsCorrect(io, room) {
    return new Promise((resolve) => {
      io.in(room).clients((err, clients) => {
        if (clients.length > MAX_CONNECTIONS_PER_USER) {
          const sock = io.in(room).connected[clients[0]]; // get first socket
          if (sock) {
            sock.emit('socket-limit-reached', null);
            sock.on('disconnect', () =>
              resolve(this.disconnectFirstSocketUntilClientsLengthIsCorrect(io, room))
            );
            sock.disconnect(true);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      });
    });
  }

  async joinUserRoom(io, socket, user) {
    const room = getRoomName(null, null, user.id);
    await userRoomKeeper.joinRoom(io, socket, user.id, room, user);
    await this.disconnectFirstSocketUntilClientsLengthIsCorrect(io, room);
  }
  // ////////////////***************JOINS***************////////////////

  // ////////////////***************LEAVE***************////////////////
  leaveRoom(io, socket, roomId) {
    roomKeeper.leaveRoom(io, socket, roomId, getRoomName(roomId));
  }

  leaveRooms(io, socket, roomId) {
    roomKeeper.leaveRooms(io, socket, roomId);
  }
  // ////////////////***************LEAVE***************////////////////
  getNewAnonymousUserId(io) {
    return new Promise((resolve) => {
      // MUST append anonymous to id because we dont want to conflict with real users EVER
      const newId = `anonymous_${uuid()}`;
      const room = getRoomName(null, null, newId);

      // check if connections exist
      io.in(room).clients(async (err, clients) => {
        if (clients.length > 0) {
          return resolve(await this.getNewAnonymousUserId(io));
        }
        return resolve(newId);
      });
    });
  }
}

function getRoomName(roomId) {
  let room = '';
  if (roomId) {
    room += (roomNamePrefixs.ROOM) + roomId;
  }
  return room;
}

module.exports = new SocketRoomsHelper();