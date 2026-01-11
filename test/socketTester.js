const io = require('socket.io-client');

async function testSocketConnection(url) {
  return new Promise((resolve, reject) => {
    const socket = io(url);
    socket.on('connect', () => {
      socket.disconnect();
      resolve();
    });
    socket.on('connect_error', reject);
    setTimeout(() => reject(new Error('Timeout')), 5000);
  });
}

module.exports = testSocketConnection;
