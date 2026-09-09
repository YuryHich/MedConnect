import { io } from 'socket.io-client';
import { getToken } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin);

/**
 * Создаёт Socket.IO-клиент с JWT из localStorage.
 * Токен передаётся в handshake.auth, сервер проверяет его в io.use().
 */
export function connectSocket() {
  return io(SOCKET_URL, {
    auth: { token: getToken() },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export { SOCKET_URL };
