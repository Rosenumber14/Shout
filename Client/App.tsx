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
    navigator.geolocation.getCurrentPosition((location) => console.log(location), (error) => console.log('error', error))
    this.connectToSync();
  }
  async connectToSync() {
    const connectionQuery = `anonymous=true&id=${await _getData('anonymousId')}`;
    try {
      const io = require('socket.io-client');
      const socket = io.connect('http://ee438ce3.ngrok.io', {query: connectionQuery});
      socket.on('connect_error', (error) => { console.log('here', error)});
      socket.on('connected', (e) => console.log(e));
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