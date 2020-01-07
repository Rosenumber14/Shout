import React from 'react';
import { AsyncStorage } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

// patches/EngineIOHeaderWarning.js
const WS = require('engine.io-client/lib/transports/websocket');

var WebSocketImpl: any = WebSocket; // eslint-disable-line no-undef

WS.prototype.doOpen = function() {
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var uri = this.uri();
  var protocols = this.protocols;
  var opts: any = {};

  if (this.extraHeaders) {
    opts.headers = this.extraHeaders;
  }
  if (this.localAddress) {
    opts.localAddress = this.localAddress;
  }

  try {
    this.ws = new WebSocketImpl(uri, protocols, opts);
  } catch (err) {
    return this.emit('error', err);
  }
};
const _getData = async (key: string): Promise<string | undefined> => {
  return AsyncStorage.getItem(key);
};

const _setData = async (key: string, value: string): Promise<void> => {
  AsyncStorage.setItem(key, value);
}

class App extends React.Component {
  socket: {
    on: (room, data) => {}
  }
   constructor(props) {
    super(props);
    this.connectToSync();
  }
  async joinBucket(socket) {
    navigator.geolocation.getCurrentPosition((location) => {
      // get bucket that we want to join
      //https://stackoverflow.com/questions/38115135/grouping-bucketing-latitude-and-longitude
      const degToSplitAt = 5; //.05 deg
      console.log(location)
      const lat = Math.ceil(((location.coords.latitude + 90) * 100)) / degToSplitAt;
      const long = Math.ceil(((location.coords.longitude + 180) * 100)) / degToSplitAt;
      // "latitude": 33.45491146632184,
      // "longitude": -111.7910586307323,
      // room_2469.2_1364.2
      socket.emit('join-room', {room: lat + '_' + long});
    }, (error) => console.log('error', error));
  }
  async connectToSync() {
    const connectionQuery = `anonymous=true&id=${await _getData('anonymousId')}`;
    try {
      const io = require('socket.io-client');
      const socket = io.connect('http://53ab6828.ngrok.io', {query: connectionQuery});
      socket.on('connect_error', (error) => { console.log('here', error)});
      socket.on('connected', (e) => {
        this.joinBucket(socket);
      });
      socket.on('connect', () => console.log('test'));
    } catch (e) {
      console.log(e)
    }
  }
  render() {
    return (
      <View style={styles.container}>
        <Text>test8</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;