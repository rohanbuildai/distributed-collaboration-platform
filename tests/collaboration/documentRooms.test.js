
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
        getDocumentAccess: jest.fn(),
        updateDocument: jest.fn()
    })
);

describe("Document Rooms and Real-Time Collaboration", () => {
    let httpServer;
    let ioServer;
    let serverUrl;

    const secret = process.env.JWT_ACCESS_SECRET;

    const operationId = "550e8400-e29b-41d4-a716-446655440000";

    const mockDocument = {
        id: "123",
        title: "Test Document",
        content: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Original content"
                        }
                    ]
                }
            ]
        },
        revision: 1
    };

    const updatedDocument = {
        ...mockDocument,
        title: "Updated Document",
        revision: 2
    };

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

    const waitForConnection = (client) => {
        return new Promise((resolve, reject) => {
            client.once("connect", resolve);
            client.once("connect_error", reject);
        });
    };

    const emitWithAck = (client, event, payload) => {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`${event} acknowledgement timed out`));
            }, 3000);

            client.emit(event, payload, (response) => {
                clearTimeout(timeout);
                resolve(response);
            });
        });
    };

    const joinDocumentRoom = async (client) => {
        return emitWithAck(client, "document:join", {
            documentId: "123"
        });
    };

    beforeAll(async () => {
        if (!secret) {
            throw new Error("JWT_ACCESS_SECRET is missing");
        }

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

        collaborationService.getDocumentAccess.mockResolvedValue({
            document: mockDocument,
            permission: "editor"
        });

        collaborationService.updateDocument.mockResolvedValue({
            document: updatedDocument,
            duplicate: false
        });
    });

    describe("Document room access", () => {
        test("allows an authorized user to join a document room", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                const response = await joinDocumentRoom(client);

                expect(response.success).toBe(true);
                expect(response.message).toBe("Joined document room");
                expect(response.data.permission).toBe("editor");
                expect(response.data.document).toEqual(mockDocument);

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

        test("rejects an unauthorized user from joining a document room", async () => {
            collaborationService.getDocumentAccess.mockRejectedValue(
                new Error("Document not found")
            );

            const client = connectClient(createToken("unknown-user"));

            try {
                await waitForConnection(client);

                const response = await joinDocumentRoom(client);

                expect(response.success).toBe(false);
                expect(response.message).toBe("Document not found");
            } finally {
                client.disconnect();
            }
        });

        test("rejects an invalid document ID while joining", async () => {
            const client = connectClient(createToken("user-123"));

            try {
                await waitForConnection(client);

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

        test("allows a connected user to leave a document room", async () => {
            const client = connectClient(createToken("user-123"));

            try {
                await waitForConnection(client);

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

    describe("Document update authorization", () => {
        test("rejects an update when the user has not joined the document room", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(403);

                expect(
                    collaborationService.updateDocument
                ).not.toHaveBeenCalled();
            } finally {
                client.disconnect();
            }
        });

        test("rejects a viewer from updating a document", async () => {
            collaborationService.getDocumentAccess
                .mockResolvedValueOnce({
                    document: mockDocument,
                    permission: "viewer"
                })
                .mockResolvedValueOnce({
                    document: mockDocument,
                    permission: "viewer"
                });

            const client = connectClient(createToken("viewer-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Unauthorized update",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(403);

                expect(
                    collaborationService.updateDocument
                ).not.toHaveBeenCalled();
            } finally {
                client.disconnect();
            }
        });

        test("rejects an invalid operation ID", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 1,
                        operationId: "invalid-operation-id"
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(400);

                expect(
                    collaborationService.updateDocument
                ).not.toHaveBeenCalled();
            } finally {
                client.disconnect();
            }
        });

        test("rejects an update without title or content", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(400);

                expect(
                    collaborationService.updateDocument
                ).not.toHaveBeenCalled();
            } finally {
                client.disconnect();
            }
        });

        test("rejects an invalid expected revision", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 0,
                        operationId
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(400);

                expect(
                    collaborationService.updateDocument
                ).not.toHaveBeenCalled();
            } finally {
                client.disconnect();
            }
        });
    });

    describe("Real-time document updates", () => {
        test("allows an editor to update a document", async () => {
            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(true);
                expect(response.message).toBe(
                    "Document updated successfully"
                );
                expect(response.data).toEqual(updatedDocument);
                expect(response.duplicate).toBe(false);

                expect(
                    collaborationService.updateDocument
                ).toHaveBeenCalledWith({
                    documentId: "123",
                    userId: "editor-123",
                    title: "Updated Document",
                    content: undefined,
                    expectedRevision: 1,
                    operationId
                });
            } finally {
                client.disconnect();
            }
        });

        test("broadcasts a successful update to other clients in the room", async () => {
            const editor = connectClient(createToken("editor-123"));
            const collaborator = connectClient(createToken("collaborator-123"));

            try {
                await Promise.all([
                    waitForConnection(editor),
                    waitForConnection(collaborator)
                ]);

                const editorJoin = await joinDocumentRoom(editor);
                const collaboratorJoin = await joinDocumentRoom(collaborator);

                expect(editorJoin.success).toBe(true);
                expect(collaboratorJoin.success).toBe(true);

                const updateEvent = new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error("Document update broadcast timed out"));
                    }, 3000);

                    collaborator.once("document:updated", (data) => {
                        clearTimeout(timeout);
                        resolve(data);
                    });
                });

                const response = await emitWithAck(
                    editor,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 1,
                        operationId
                    }
                );

                const broadcast = await updateEvent;

                expect(response.success).toBe(true);
                expect(broadcast).toEqual({
                    document: updatedDocument
                });
            } finally {
                editor.disconnect();
                collaborator.disconnect();
            }
        });

        test("does not broadcast a duplicate operation", async () => {
            collaborationService.updateDocument.mockResolvedValue({
                document: updatedDocument,
                duplicate: true
            });

            const editor = connectClient(createToken("editor-123"));
            const collaborator = connectClient(createToken("collaborator-123"));

            try {
                await Promise.all([
                    waitForConnection(editor),
                    waitForConnection(collaborator)
                ]);

                await joinDocumentRoom(editor);
                await joinDocumentRoom(collaborator);

                const receivedUpdates = [];

                collaborator.on("document:updated", (data) => {
                    receivedUpdates.push(data);
                });

                const response = await emitWithAck(
                    editor,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Updated Document",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(true);
                expect(response.message).toBe("Operation already processed");
                expect(response.duplicate).toBe(true);
                expect(response.data).toEqual(updatedDocument);

                expect(receivedUpdates).toHaveLength(0);
            } finally {
                editor.disconnect();
                collaborator.disconnect();
            }
        });

        test("returns the latest document when an update has a stale revision", async () => {
            const staleError = new Error("Document has been modified by another user");
            staleError.statusCode = 409;

            collaborationService.updateDocument.mockRejectedValue(staleError);

            const client = connectClient(createToken("editor-123"));

            try {
                await waitForConnection(client);

                await joinDocumentRoom(client);

                const response = await emitWithAck(
                    client,
                    "document:update",
                    {
                        documentId: "123",
                        title: "Stale update",
                        expectedRevision: 1,
                        operationId
                    }
                );

                expect(response.success).toBe(false);
                expect(response.statusCode).toBe(409);

                expect(response.data).toEqual({
                    document: mockDocument
                });
            } finally {
                client.disconnect();
            }
        });
    });
});
