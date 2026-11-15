
require("dotenv").config();

const validateEnv = require("./config/validateEnv");
validateEnv();

const app = require("./app");
const pool = require("./config/database");

const { Server } = require("socket.io");

const socketAuthMiddleware = require(
    "./modules/collaboration/Middleware/socketAuthMiddleware"
);
const registerCollaborationSocket = require(
    "./modules/collaboration/Socket/collaborationSocket"
);

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


const io = new Server(server);

io.use(socketAuthMiddleware);
registerCollaborationSocket(io);

io.on("connection", (socket) => {
    console.log(`Authenticated socket connected: ${socket.user.id}`);

    socket.on("disconnect", (reason) => {
        console.log(
            `Socket disconnected: ${socket.user.id}, reason: ${reason}`
        );
    });
});

let isShuttingDown = false;

async function shutdown(signal) {
    if (isShuttingDown) {
        return;
    }

    isShuttingDown = true;

    console.log(`${signal} received. Starting graceful shutdown...`);

    const forceShutdownTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out. Forcing HTTP connections closed.");

        server.closeAllConnections();

        process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
        await new Promise((resolve) => {
            io.close(resolve);
        });

        await pool.end();

        clearTimeout(forceShutdownTimer);

        console.log(
            "Socket.IO, HTTP server and PostgreSQL pool closed successfully."
        );

        process.exitCode = 0;
    } catch (error) {
        clearTimeout(forceShutdownTimer);

        console.error("Error during graceful shutdown:", error);

        process.exitCode = 1;
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
