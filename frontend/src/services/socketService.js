
import { io } from "socket.io-client";

const SOCKET_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

let socket = null;

const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            withCredentials: true,
        });
    }

    return socket;
};

const connectSocket = () => {
    const socketInstance = getSocket();

    if (!socketInstance.connected) {
        socketInstance.connect();
    }

    return socketInstance;
};

const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
    }
};

export {
    getSocket,
    connectSocket,
    disconnectSocket,
};
