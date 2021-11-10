import express from 'express';
import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 9000;
const BACKEND = process.env.WS_URL;
let interval = null;

const options = {
  WebSocket: WebSocket,
  connectionTimeout: 10000,
};

const server = express();
const ws = new ReconnectingWebSocket(BACKEND, [], options);

server.use(express.json());

function createData() {
  const data = {
    moduleId: 'test-module-1',
    state: 'ok',
    TEMPERATURE: [
      {
        TEMP: Math.floor(Math.random() * 30 + 10),
        REGULATION_ENABLED: true,
        STATE: 'IN_PROGRESS',
        DEVICE: 'TEMP_1',
      },

      {
        TEMP: Math.floor(Math.random() * 30 + 10),
        REGULATION_ENABLED: false,
        STATE: 'WAITING',
        DEVICE: 'TEMP_2',
      },
    ],
    MOTOR: [
      {
        SPEED: Math.floor(Math.random() * 50 + 20),
        RPM: Math.floor(Math.random() * 30 + 10),
        STATE: 'IN_PROGRESS',
        DEVICE: 'MOTOR_1',
      },
      {
        SPEED: 0,
        RPM: 0,
        STATE: 'WAITING',
        DEVICE: 'MOTOR_2',
      },
    ],
    UNLOADER: [
      {
        UNLOADED: true,
        STATE: 'WAITING',
        DEVICE: 'FERMENTABLE',
      },
      {
        UNLOADED: false,
        STATE: 'WAITING',
        DEVICE: 'YEAST',
      },
      {
        UNLOADED: false,
        STATE: 'WAITING',
        DEVICE: 'HOPS',
      },
      {
        UNLOADED: false,
        STATE: 'WAITING',
        DEVICE: 'OTHER',
      },
    ],
    PUMP: [
      {
        ENABLED: false,
        STATE: 'WAITING',
        DEVICE: 'PUMP_1',
      },
    ],
  };

  return data;
}

function sendData() {
  console.log(`${new Date().toISOString().substring(11, 19)}: Sending data`);
  const data = createData();
  ws.send(JSON.stringify(data));
}

ws.addEventListener('open', () => {
  console.log(`WebSocket connected to: ${BACKEND}\n`);
  sendData();
  interval = setInterval(sendData, 5000);
});

ws.onmessage = function incoming(message) {
  console.log('%s', message.data);
};

ws.onclose = function event() {
  console.log('Socket is closed.');
  clearInterval(interval);
};

server.listen(PORT, function () {
  console.log('HTTP Server is running on PORT:', PORT);
});
