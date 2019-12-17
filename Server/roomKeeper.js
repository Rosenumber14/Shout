const R = require('ramda');

class RoomKeeper {
  constructor() {
    this.rooms = {};
  }

  addRoom(id, room) {
    if (!this.rooms[id]) {
      this.rooms[id] = {};
    }
    if (room && !this.rooms[id][room]) {
      this.rooms[id][room] = {};
    }
  }

  closeRoom(io, id, roomName) {
    if (roomName) {
      io.in(roomName).clients((err, clients) => {
        R.forEach((i) => {
          const socket = io.in(roomName).connected[clients[i]];
          this.leaveRoom(io, socket, id, roomName);
        }, R.keys(clients));
      });
    } else if (this.rooms[id]) {
      R.forEach((room) => {
        io.in(room).clients((err, clients) => {
          R.forEach((i) => {
            const socket = io.in(room).connected[clients[i]];
            this.leaveRoom(io, socket, id, room);
          }, R.keys(clients));
        });
      }, R.keys(this.rooms[id]));
    }
  }

  async getSocketsByRoom(io, id, roomName) {
    const socketsByRoom = {};
    if (roomName) {
      socketsByRoom[roomName] = await getSocketsInRoom(io, roomName);
    } else if (this.rooms[id]) {
      const roomNames = R.keys(this.rooms[id]);
      for (let i = 0; i < roomNames.length; i++) {
        const room = roomNames[i];
        socketsByRoom[room] = await getSocketsInRoom(io, room); // eslint-disable-line no-await-in-loop
      }
    }
    return socketsByRoom;
  }

  emit(io, id, roomName, event, data) {
    if (!id) {
      return;
    }
    if (!this.roomExists(id, roomName)) {
      return;
    }
    return io.to(roomName).emit(event, JSON.stringify(data));
  }

  emitToAllRoomsById(io, id, event, data) {
    if (!id) {
      return;
    }

    return R.forEach((roomName) => this.emit(io, id, roomName, event, data), R.keys(this.rooms[id]));
  }

  getRooms() {
    return R.merge({}, this.rooms); // return copy so they cant be modified
  }

  handleDisconnect(io, socket) {
    // loop through rooms and make sure they still have other clients
    R.forEach((room) => {
      const thisRoom = io.sockets.adapter.rooms[room];
      if (thisRoom && thisRoom.length === 1) {
        if (thisRoom.uniqueIds) {
          R.map((uniqueId) => {
            this._removeRoom(uniqueId, room);
          }, thisRoom.uniqueIds);
        } else if (thisRoom.uniqueId) {
          this._removeRoom(thisRoom.uniqueId, room);
        }
      }
    }, R.keys(socket.rooms));
  }

  joinRoomAndAddRoomRefToMultipleIds(io, socket, ids, roomName, user) {
    // used in dashboard-rooms where ids are boardIds and roomName is uniq
    socket.join(roomName, () => {
      R.forEach((id) => {
        this.addRoom(id, roomName);
      }, ids);
      if (io.sockets.adapter.rooms[roomName]) {
        io.sockets.adapter.rooms[roomName].uniqueIds = ids; // eslint-disable-line no-param-reassign
      }
    });
    console.log(`user ${user.id} joined room ${roomName}`); // eslint-disable-line no-console
  }

  async joinRoom(io, socket, id, roomName, user) {
    return new Promise((resolve) => socket.join(roomName, () => {
      this.addRoom(id, roomName);
      if (io.sockets.adapter.rooms[roomName]) {
        io.sockets.adapter.rooms[roomName].uniqueId = id; // eslint-disable-line no-param-reassign
      }
      console.log(`user ${user.id} joined room ${roomName}`); // eslint-disable-line no-console
      resolve();
    }));
  }

  leaveDuplicateRooms(io, socket, stringToLookFor) {
    R.forEach((room) => {
      if (room.indexOf(stringToLookFor) !== -1) {
        const thisRoom = io.sockets.adapter.rooms[room];

        if (!thisRoom) {
          return;
        }
        if (thisRoom.uniqueIds) {
          R.map((uniqueId) => {
            this.leaveRoom(io, socket, uniqueId, room);
          }, thisRoom.uniqueIds);
        } else {
          this.leaveRoom(io, socket, thisRoom.uniqueId, room);
        }
      }
    }, R.keys(socket.rooms));
  }

  leaveRooms(io, socket, id) {
    if (!this.rooms[id]) {
      return;
    }
    // loop through rooms and make sure they still have other clients
    R.forEach((room) => {
      if (this.rooms[id][room]) {
        this.leaveRoom(io, socket, id, room);
      }
    }, R.keys(socket.rooms));
  }

  leaveRoom(io, socket, id, roomName) {
    socket.leave(roomName, () => {
      const room = io.sockets.adapter.rooms[roomName];
      if (!room) {
        this._removeRoom(id, roomName);
      }
    });
  }

  _removeRoom(id, room) { // _ means do not call this outside of this class
    if (room && this.rooms[id]) {
      delete this.rooms[id][room];
    }

    if (id && this.rooms[id]) {
      const obj = this.rooms[id];
      let hasAnyRooms = false;
      if (R.keys(obj).length > 0) {
        hasAnyRooms = true;
      }
      if (!hasAnyRooms) {
        delete this.rooms[id];
      }
    }
  }

  removeAllRoomsByTopLevelIdWithoutRemovingSockets(id, roomName) {
    return this._removeRoom(id, roomName);
  }

  roomExists(id, room) {
    return R.pathOr(false, [id, room], this.rooms);
  }
}

function getSocketsInRoom(io, roomName) {
  return new Promise((resolve) => {
    const ioRoom = io.in(roomName);
    ioRoom.clients((err, clients) => {
      resolve(R.map((client) => ioRoom.connected[client], clients));
    });
  });
}

module.exports = RoomKeeper;