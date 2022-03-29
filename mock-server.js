import WebSocket from 'ws';
import ReconnectingWebSocket from 'reconnecting-websocket';
import dotenv from 'dotenv';

import { data } from './data.js';

const IN_PROGRESS = 'IN_PROGRESS';
const WAITING = 'WAITING';
const DONE = 'DONE';

// load env variables
dotenv.config();

const BACKEND = process.env.WS_URL;
const SENDING_INTERVAL_MS = process.env.SENDING_INTERVAL_MS;

// timer
let sendingInterval = null;

const options = {
  WebSocket: WebSocket,
  //debug: true,
  connectionTimeout: 10000,
};

// start websocket
const ws = new ReconnectingWebSocket(BACKEND, [], options);

let module_data = data;
let tempTarget = null;
const instructions = [];
let instructionCount = 0;
let pumpDelay = 0;

function wait(ms) {
  let start = new Date().getTime();
  let end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

function updateData() {
  if (!instructions.length) return;
  const instruction = instructions[0];

  if (instruction.instruction === 'SET_TEMPERATURE') {
    for (let i = 0; i < module_data.TEMPERATURE.length; i++) {
      let device = module_data.TEMPERATURE[i];

      if (device.DEVICE === instruction.device) {
        tempTarget = parseInt(instruction.params);

        if (tempTarget > device.TEMP) {
          device.TEMP += 3;
          device.REGULATION_ENABLED = true;
          device.STATE = IN_PROGRESS;
        } else if (tempTarget < device.TEMP && device.STATE === IN_PROGRESS) {
          device.REGULATION_ENABLED = false;
          device.STATE = DONE;
        } else if (device.STATE === DONE) {
          device.STATE = WAITING;
          tempTarget = null;
          instructionCount -= 1;
          instructions.shift();
        }

        break;
      }
    }
  } else if (instruction.instruction === 'SET_MOTOR_SPEED') {
    for (let i = 0; i < module_data.MOTOR.length; i++) {
      let device = module_data.MOTOR[i];
      if (device.DEVICE === instruction.device) {
        if (device.STATE === WAITING) {
          device.SPEED = parseInt(instruction.params);
          device.RPM = parseInt(instruction.params);
          device.STATE = DONE;
        } else if (device.STATE === DONE) {
          device.STATE = WAITING;
          instructionCount -= 1;
          instructions.shift();
        }

        break;
      }
    }
  } else if (instruction.instruction === 'TRANSFER_LIQUIDS') {
    let device = module_data.PUMP[0];
    if (pumpDelay < 3) {
      device.ENABLED = true;
      device.STATE = IN_PROGRESS;
      pumpDelay++;
    } else if (device.STATE === IN_PROGRESS && pumpDelay >= 3) {
      device.ENABLED = false;
      device.STATE = DONE;
    } else if (device.STATE === DONE) {
      device.STATE = WAITING;
      instructionCount -= 1;
      instructions.shift();
      pumpDelay = 0;
    }
  } else if (instruction.instruction === 'UNLOAD') {
    for (let i = 0; i < module_data.UNLOADER.length; i++) {
      let device = module_data.UNLOADER[i];
      if (device.DEVICE === instruction.device) {
        if (device.STATE === WAITING) {
          device.UNLOADED = true;
          device.STATE = DONE;
        } else if (device.STATE === DONE) {
          device.STATE = WAITING;
          instructionCount -= 1;
          instructions.shift();
        }
        break;
      }
    }
  } else if (instruction.instruction === 'WAIT') {
    const wait_ms = parseFloat(instruction.params);
    const device = module_data.TIMER[0];

    // initial set
    if (device.REMAINING === 0 && device.STATE === WAITING) {
      device.REMAINING = wait_ms / 1000;
      device.STATE = IN_PROGRESS;
    }

    if (device.REMAINING > 0 && device.STATE === IN_PROGRESS) {
      device.REMAINING -= SENDING_INTERVAL_MS / 1000;
    } else if (device.REMAINING <= 0 && device.STATE === IN_PROGRESS) {
      device.REMAINING = 0;
      device.STATE = DONE;
    } else if (device.STATE === DONE) {
      device.STATE = WAITING;
      instructionCount -= 1;
      instructions.shift();
    }
  } else if (instruction.instruction === 'MANUAL') {
    wait(5000);
    instructionCount -= 1;
    instructions.shift();
  }
}

function finish() {
  instructions.slice();
  tempTarget = null;
  instructionCount = 0;
  module_data = data;
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
  console.log(`WebSocket connected to: ${BACKEND}`);
  console.log(`Sending interval: ${SENDING_INTERVAL_MS}\n`);

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
    let incomingInstruction = JSON.parse(message.data);
    if (incomingInstruction.type === 'instruction') {
      instructions.push(incomingInstruction);
      console.log('Inštrukcia z backendu.');
      console.log(instructions[instructionCount]);
      instructionCount += 1;
    } else if (incomingInstruction.type === 'abort') {
      console.log('Varenie bolo prerušené!');
      finish();
    } else {
      console.log('%s', incomingInstruction);
    }
  } else {
    console.log('%s', message.data);
  }
};

ws.onclose = function event() {
  console.log('Socket is closed.');
  clearInterval(sendingInterval);
  finish();
};
