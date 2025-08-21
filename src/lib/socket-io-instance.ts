import { Server } from 'socket.io';

let io: Server | undefined;

export const setIoInstance = (instance: Server) => {
  io = instance;
};

export const getIoInstance = (): Server | undefined => {
  return io;
};
