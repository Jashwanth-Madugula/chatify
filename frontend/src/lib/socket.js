import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const connectSocket = (userId) => {
  return io(BACKEND_URL, {
    query: { userId },
  });
};
