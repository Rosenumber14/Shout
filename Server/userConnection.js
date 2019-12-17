const socketRoomsHelper = require('./socketRoomsHelper');

const initialize = (user, socket, io) => {
  console.log(`user ${user.id} connected`);
  socketRoomsHelper.joinUserRoom(io, socket, user);
  // store the user_id on the socket
  socket.user_id = user.id;
  socket.emit('connected', user); // tell the user who they are

  socket.on('disconnect', (reason) => {
    console.log(`reason: ${reason}`);
  });
  socket.on('disconnecting', () => {
    console.log(`user ${user.id} disconnected`);
    socketRoomsHelper.handleDisconnect(io, socket);
  });
  socket.on('error', (err) => {
    console.error(`error for user ${user.id}: ${err}`);
  });
};

module.exports = {
  initialize
};