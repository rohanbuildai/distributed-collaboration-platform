
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");

const socketAuthMiddleware = require(
    "../../src/modules/collaboration/Middleware/socketAuthMiddleware"
);

describe("Socket.IO Authentication Integration", () => {
    let httpServer;
    let ioServer;
    let serverUrl;

    const secret = process.env.JWT_ACCESS_SECRET;

    const createToken = (payload, options = {}) => {
        return jwt.sign(payload, secret, options);
    };

    beforeAll(async () => {
        if (!secret) {
            throw new Error("JWT_ACCESS_SECRET is missing from .env.test");
        }

        httpServer = http.createServer();

        ioServer = new Server(httpServer);

        ioServer.use(socketAuthMiddleware);

        ioServer.on("connection", (socket) => {
            socket.emit("authenticated", {
                userId: socket.user.id
            });
        });

        await new Promise((resolve) => {
            httpServer.listen(0, "127.0.0.1", resolve);
        });

        const address = httpServer.address();

        serverUrl = `http://127.0.0.1:${address.port}`;
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            ioServer.close(resolve);
        });
    });

    test("should establish a connection with a valid access token", async () => {
        const token = createToken({
            sub: "123",
            type: "access"
        });

        const client = createClient(serverUrl, {
            auth: { token },
            reconnection: false,
            forceNew: true
        });

        try {
           const authenticated = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error("Authentication timed out"));
            }, 3000);

            const cleanup = () => {
                clearTimeout(timeout);
                client.off("authenticated", handleAuthenticated);
                client.off("connect_error", handleError);
            };

            const handleAuthenticated = (data) => {
                cleanup();
                resolve(data);
            };

            const handleError = (error) => {
                cleanup();
                reject(error);
            };

            client.once("authenticated", handleAuthenticated);
            client.once("connect_error", handleError);
        });

            expect(authenticated).toEqual({
                userId: "123"
            });

            expect(client.connected).toBe(true);
        } finally {
            client.disconnect();
        }
    });

    test("should reject a connection without an access token", async () => {
        const client = createClient(serverUrl, {
            reconnection: false,
            forceNew: true
        });

        try {
            const error = await new Promise((resolve) => {
                client.once("connect_error", resolve);
            });

            expect(error.message).toBe("Authentication required");
            expect(client.connected).toBe(false);
        } finally {
            client.disconnect();
        }
    });

    test("should reject a connection with an invalid access token", async () => {
        const client = createClient(serverUrl, {
            auth: {
                token: "invalid-token"
            },
            reconnection: false,
            forceNew: true
        });

        try {
            const error = await new Promise((resolve) => {
                client.once("connect_error", resolve);
            });

            expect(error.message).toBe(
                "Invalid or expired access token"
            );

            expect(client.connected).toBe(false);
        } finally {
            client.disconnect();
        }
    });
});
