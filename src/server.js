
require("dotenv").config();

const validateEnv = require("./config/validateEnv");
validateEnv();

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 10000;

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
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
        await new Promise((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });

        await pool.end();

        clearTimeout(forceShutdownTimer);
        console.log("HTTP server and PostgreSQL pool closed successfully.");
        process.exitCode = 0;
    } catch (error) {
        clearTimeout(forceShutdownTimer);
        console.error("Error during graceful shutdown:", error);
        process.exitCode = 1;
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
