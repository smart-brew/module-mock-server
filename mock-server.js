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

function initData() {
  const data = {
    moduleId: 'test-module-1',
    state: 'ok',
    TEMPERATURE: [
      {
        TEMP: 20,
        REGULATION_ENABLED: false,
        STATE: 'WAITING',
        DEVICE: 'TEMP_1',
      },

      {
        TEMP: 20,
        REGULATION_ENABLED: false,
        STATE: 'WAITING',
        DEVICE: 'TEMP_2',
      },
    ],
    MOTOR: [
      {
        SPEED: 0,
        RPM: 0,
        STATE: 'WAITING',
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
        UNLOADED: false,
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

let module_data = initData();
let tempTarget = null;
let inst = null;
let new_inst = 0;

function createData(instruction) {
  if (instruction.INSTRUCTION === 'SET_TEMPERATURE') {
    for (let i = 0; i < module_data.TEMPERATURE.length; i++) {
      if (module_data.TEMPERATURE[i].DEVICE === instruction.DEVICE) {
        tempTarget = parseInt(instruction.PARAMS);

        if (tempTarget > module_data.TEMPERATURE[i].TEMP) {
          module_data.TEMPERATURE[i].TEMP += 10;
          module_data.TEMPERATURE[i].REGULATION_ENABLED = true;
          module_data.TEMPERATURE[i].STATE = 'IN_PROGRESS';
        }

        if (tempTarget === module_data.TEMPERATURE[i].TEMP) {
          module_data.TEMPERATURE[i].REGULATION_ENABLED = false;
          module_data.TEMPERATURE[i].STATE = 'DONE';
        }

        if (module_data.TEMPERATURE[i].STATE === 'DONE') {
          module_data.TEMPERATURE[i].STATE = 'WAITING';
          tempTarget = null;
          new_inst = 0;
        }

        break;
      }
    }
  } else if (instruction.INSTRUCTION === 'SET_MOTOR_SPEED') {
    for (let i = 0; i < module_data.MOTOR.length; i++) {
      if (module_data.MOTOR[i].DEVICE === instruction.DEVICE) {
        module_data.MOTOR[i].SPEED = parseInt(instruction.PARAMS);
        module_data.MOTOR[i].RPM = parseInt(instruction.PARAMS);
        break;
      }
    }
  }

  return module_data;
}

function sendData() {
  console.log(`${new Date().toISOString().substring(11, 19)}: Sending data`);
  ws.send(JSON.stringify(module_data));

  if (new_inst !== 0) {
    module_data = createData(inst);
  }
}

ws.addEventListener('open', () => {
  console.log(`WebSocket connected to: ${BACKEND}\n`);
  sendData();
  interval = setInterval(sendData, 5000);
});

function IsJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

ws.onmessage = function incoming(message) {
  if (IsJsonString(message.data)) {
    inst = JSON.parse(message.data);
    console.log('Inštrukcia z backendu.');
    console.log(inst);
    new_inst = 1;
  } else {
    console.log('%s', message.data);
  }
};

ws.onclose = function event() {
  console.log('Socket is closed.');
  clearInterval(interval);
  tempTarget = null;
  new_inst = 0;
  module_data = initData();
};

server.listen(PORT, function () {
  console.log('HTTP Server is running on PORT:', PORT);
});
