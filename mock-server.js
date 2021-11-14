import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import dotenv from 'dotenv';

import { data } from './data.js';

// load env variables
dotenv.config();

const BACKEND = process.env.WS_URL;
const SENDING_INTERVAL_MS = 3000;

// timer
let sendingInterval = null;

const options = {
  WebSocket: WebSocket,
  connectionTimeout: 10000,
};

// start websocket
const ws = new ReconnectingWebSocket(BACKEND, [], options);

let module_data = data;
let tempTarget = null;
const instructions = [];
let instructionCount = 0;
let pumpDelay = 0;

function updateData() {
  if (!instructions.length) return;
  const instruction = instructions[0];

  if (instruction.INSTRUCTION === 'SET_TEMPERATURE') {
    for (let i = 0; i < module_data.TEMPERATURE.length; i++) {
      let device = module_data.TEMPERATURE[i];

      if (device.DEVICE === instruction.DEVICE) {
        tempTarget = parseInt(instruction.PARAMS);

        if (tempTarget > device.TEMP) {
          device.TEMP += 3;
          device.REGULATION_ENABLED = true;
          device.STATE = 'IN_PROGRESS';
        } else if (tempTarget < device.TEMP) {
          device.REGULATION_ENABLED = false;
          device.STATE = 'DONE';
        } else if (device.STATE === 'DONE') {
          device.STATE = 'WAITING';
          tempTarget = null;
          instructionCount -= 1;
          instructions.shift();
        }

        break;
      }
    }
  } else if (instruction.INSTRUCTION === 'SET_MOTOR_SPEED') {
    for (let i = 0; i < module_data.MOTOR.length; i++) {
      let device = module_data.MOTOR[i];
      if (device.DEVICE === instruction.DEVICE) {
        if (device.STATE === 'WAITING') {
          device.SPEED = parseInt(instruction.PARAMS);
          device.RPM = parseInt(instruction.PARAMS);
          device.STATE = 'DONE';
        } else if (device.STATE === 'DONE') {
          device.STATE = 'WAITING';
          instructionCount -= 1;
          instructions.shift();
        }

        break;
      }
    }
  } else if (instruction.INSTRUCTION === 'TRANSFER_LIQUIDS') {
    let device = module_data.PUMP[0];
    if (pumpDelay < 3) {
      device.ENABLED = true;
      device.STATE = 'IN_PROGRESS';
      pumpDelay++;
    } else {
      device.ENABLED = false;
      device.STATE = 'WAITING';
      instructionCount -= 1;
      pumpDelay = 0;
      instructions.shift();
    }
  } else if (instruction.INSTRUCTION === 'UNLOAD') {
    for (let i = 0; i < module_data.UNLOADER.length; i++) {
      let device = module_data.UNLOADER[i];
      if (device.DEVICE === instruction.DEVICE) {
        if (device.STATE === 'WAITING') {
          device.UNLOADED = true;
          device.STATE = 'DONE';
        } else if (device.STATE === 'DONE') {
          device.STATE = 'WAITING';
          instructionCount -= 1;
          instructions.shift();
        }
        break;
      }
    }
  }
}

function getData() {
  // add some randomness to data
  module_data.TEMPERATURE[0].TEMP += Math.random() * 3 - 1.5;
  module_data.TEMPERATURE[1].TEMP += Math.random() * 3 - 1.5;
  module_data.MOTOR[0].RPM += Math.random() * 3 - 1.5;
  module_data.MOTOR[1].RPM += Math.random() * 3 - 1.5;

  return module_data;
}

function sendData() {
  updateData();

  console.log(`${new Date().toISOString().substring(11, 19)} Sending data`);
  ws.send(JSON.stringify(getData()));
}

ws.addEventListener('open', () => {
  console.log(`WebSocket connected to: ${BACKEND}\n`);
  sendData();
  sendingInterval = setInterval(sendData, SENDING_INTERVAL_MS);
});

function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

ws.onmessage = function incoming(message) {
  if (isJsonString(message.data)) {
    instructions.push(JSON.parse(message.data));
    console.log('Inštrukcia z backendu.');
    console.log(instructions[instructionCount]);
    instructionCount += 1;
  } else {
    console.log('%s', message.data);
  }
};

ws.onclose = function event() {
  console.log('Socket is closed.');

  clearInterval(sendingInterval);

  instructions.slice();
  tempTarget = null;
  instructionCount = 0;
  module_data = data;
};
