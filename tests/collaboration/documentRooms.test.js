
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");

const socketAuthMiddleware = require(
    "../../src/modules/collaboration/Middleware/socketAuthMiddleware"
);

const collaborationService = require(
    "../../src/modules/collaboration/Services/collaborationService"
);

const registerCollaborationSocket = require(
    "../../src/modules/collaboration/Socket/collaborationSocket"
);

jest.mock(
    "../../src/modules/collaboration/Services/collaborationService",
    () => ({
        getDocumentAccess: jest.fn()
    })
);

describe("Document Rooms", () => {
    let httpServer;
    let ioServer;
    let serverUrl;

    const secret = process.env.JWT_ACCESS_SECRET;

    const createToken = (userId) => {
        return jwt.sign(
            {
                sub: userId,
                type: "access"
            },
            secret
        );
    };

    const connectClient = (token) => {
        return createClient(serverUrl, {
            auth: { token },
            reconnection: false,
            forceNew: true
        });
    };

    const emitWithAck = (client, event, payload) => {
        return new Promise((resolve) => {
            client.emit(event, payload, resolve);
        });
    };

    beforeAll(async () => {
        httpServer = http.createServer();

        ioServer = new Server(httpServer);

        ioServer.use(socketAuthMiddleware);

        registerCollaborationSocket(ioServer);

        await new Promise((resolve) => {
            httpServer.listen(0, "127.0.0.1", resolve);
        });

        serverUrl = `http://127.0.0.1:${httpServer.address().port}`;
    });

    afterAll(async () => {
        await new Promise((resolve) => {
            ioServer.close(resolve);
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should allow an authorized user to join a document room", async () => {
        collaborationService.getDocumentAccess.mockResolvedValue({
            document: {
                id: "123",
                title: "Test Document",
                revision: 1
            },
            permission: "editor"
        });

        const client = connectClient(createToken("editor-123"));

        try {
            await new Promise((resolve, reject) => {
                client.once("connect", resolve);
                client.once("connect_error", reject);
            });

            const response = await emitWithAck(
                client,
                "document:join",
                { documentId: "123" }
            );

            expect(response.success).toBe(true);
            expect(response.data.permission).toBe("editor");

            expect(
                collaborationService.getDocumentAccess
            ).toHaveBeenCalledWith({
                documentId: "123",
                userId: "editor-123"
            });
        } finally {
            client.disconnect();
        }
    });

    test("should reject an unauthorized user", async () => {
        collaborationService.getDocumentAccess.mockRejectedValue(
            new Error("Document not found")
        );

        const client = connectClient(createToken("unknown-user"));

        try {
            await new Promise((resolve, reject) => {
                client.once("connect", resolve);
                client.once("connect_error", reject);
            });

            const response = await emitWithAck(
                client,
                "document:join",
                { documentId: "123" }
            );

            expect(response.success).toBe(false);
            expect(response.message).toBe("Document not found");
        } finally {
            client.disconnect();
        }
    });

    test("should reject an invalid document ID", async () => {
        const client = connectClient(createToken("user-123"));

        try {
            await new Promise((resolve, reject) => {
                client.once("connect", resolve);
                client.once("connect_error", reject);
            });

            const response = await emitWithAck(
                client,
                "document:join",
                { documentId: "invalid-id" }
            );

            expect(response.success).toBe(false);
            expect(response.message).toBe("Invalid document ID");

            expect(
                collaborationService.getDocumentAccess
            ).not.toHaveBeenCalled();
        } finally {
            client.disconnect();
        }
    });

    test("should allow a connected user to leave a document room", async () => {
        const client = connectClient(createToken("user-123"));

        try {
            await new Promise((resolve, reject) => {
                client.once("connect", resolve);
                client.once("connect_error", reject);
            });

            const response = await emitWithAck(
                client,
                "document:leave",
                { documentId: "123" }
            );

            expect(response.success).toBe(true);
            expect(response.message).toBe("Left document room");
        } finally {
            client.disconnect();
        }
    });
});
