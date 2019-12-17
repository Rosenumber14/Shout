const Express = require('express');
const sio = require('socket.io');
const UserConnection = require('./userConnection');
const socketRoomsHelper = require('./socketRoomsHelper');

const app = new Express();
const server = app.listen(3000);

app.get(`/`, (req, res) => {
  res.sendStatus(200);
});

const io = sio(server, {
  pingTimeout: 30000
});

// Emit welcome message on connection
io.on('connection', async (socket) => {
  try {
    // check to see if user gave me a authToken
    let userId = socket.handshake.query.id ? socket.handshake.query.id : null;
    if (!userId || userId === 'null') {
      userId = await socketRoomsHelper.getNewAnonymousUserId(io);
    }
    console.log('userId', userId)
    UserConnection.initialize({ id: userId, isAnonymous: true }, socket, io);
  } catch (e) {
    console.log(e)
    socket.disconnect(true);
  }
});