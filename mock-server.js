import express from 'express';
import WebSocket from 'ws';

const PORT = 9000;
const BACKEND = 'ws://localhost:8001';

const server = express();

const ws = new WebSocket(BACKEND);

server.use(express.json());

ws.on('message', function incoming(message) {
  console.log('received: %s', message);
});

function createData() {
  let data = {
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
  let data = createData();
  ws.send(JSON.stringify(data));
}

ws.onopen = function event() {
  setInterval(sendData, 5000);
};

server.listen(PORT, function () {
  console.log('HTTP Server is running on PORT:', PORT);
});
