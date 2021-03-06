export const data = {
  moduleId: 1,
  status: 'ok',
  TEMPERATURE: [
    {
      TEMP: 20,
      REGULATION_ENABLED: false,
      STATE: 'WAITING',
      DEVICE: 'TEMP_1',
      temp0: 20,
      temp1: 20,
      temp2: 20,
      temp3: 20,
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
  SYSTEM: [
    {
      REMAINING: 0,
      STATE: 'WAITING',
      DEVICE: 'WAIT',
    },
  ],
};
