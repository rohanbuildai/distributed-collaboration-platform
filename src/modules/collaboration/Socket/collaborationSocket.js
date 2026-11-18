
const collaborationService = require(
    "../Services/collaborationService"
);

const presenceService = require("../Services/presenceService")

const getRoomName = (documentId) => {
    return `document:${documentId}`;
};


const removeUnauthorizedSockets = async (io, room, documentId) => {
    const connectedSockets = await io.in(room).fetchSockets();

    await Promise.all(
        connectedSockets.map(async (connectedSocket) => {
            try {
                await collaborationService.getDocumentAccess({
                    documentId,
                    userId: connectedSocket.data.userId
                });
            } catch (error) {
                await connectedSocket.leave(room);

                const result =
                    presenceService.removeSocketFromDocument({
                        documentId,
                        userId: connectedSocket.data.userId,
                        socketId: connectedSocket.id
                    });

                if (result.isLastConnection) {
                    io.to(room).emit("user:left", {
                        userId: connectedSocket.data.userId
                    });
                }
            }
        })
    );
};


const registerCollaborationSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.user.id}`);

        socket.on("document:join", async (payload, acknowledge) => {
            const ack = typeof acknowledge === "function"
                ? acknowledge
                : () => {};

            try {
                const { documentId } = payload || {};

                if (
                    typeof documentId !== "string" ||
                    !/^[1-9]\d*$/.test(documentId)
                ) {
                    return ack({
                        success: false,
                        message: "Invalid document ID"
                    });
                }

                const { document, permission } =
                    await collaborationService.getDocumentAccess({
                        documentId,
                        userId: socket.user.id
                    });

                const room = getRoomName(documentId);

                
                await socket.join(room);

                const existingUsers =
                    presenceService.getDocumentPresence(documentId)
                        .filter((userId) => userId !== String(socket.user.id));

                const presenceResult =
                    presenceService.addSocketToDocument({
                        documentId,
                        userId: socket.user.id,
                        socketId: socket.id
                    });

                if (presenceResult.isFirstConnection) {
                    socket.to(room).emit("user:joined", {
                        userId: socket.user.id
                    });
                }

                return ack({
                    success: true,
                    message: "Joined document room",
                    data: {
                        document,
                        permission,
                        presence: existingUsers
                    }
                });

            } catch (error) {
                return ack({
                    success: false,
                    message: error.message || "Unable to join document"
                });
            }
        });

        socket.on("document:leave", async (payload, acknowledge) => {
            const ack = typeof acknowledge === "function"
                ? acknowledge
                : () => {};

            try {
                const { documentId } = payload || {};

                if (
                    typeof documentId !== "string" ||
                    !/^[1-9]\d*$/.test(documentId)
                ) {
                    return ack({
                        success: false,
                        message: "Invalid document ID"
                    });
                }

                
                const room = getRoomName(documentId);

                await socket.leave(room);

                const result = presenceService.removeSocketFromDocument({
                    documentId,
                    userId: socket.user.id,
                    socketId: socket.id
                });

                if (result.isLastConnection) {
                    socket.to(room).emit("user:left", {
                        userId: socket.user.id
                    });
                }

                return ack({
                    success: true,
                    message: "Left document room"
                });

            } catch (error) {
                return ack({
                    success: false,
                    message: "Unable to leave document room"
                });
            }
        });

        socket.on("document:update", async (payload, acknowledge) => {
            const ack = typeof acknowledge === "function"
                ? acknowledge
                : () => {};

            try {
                const {
                    documentId,
                    title,
                    content,
                    expectedRevision ,
                    operationId
                } = payload || {};

                if (
                    typeof documentId !== "string" ||
                    !/^[1-9]\d*$/.test(documentId)
                ) {
                    return ack({
                        success: false,
                        statusCode: 400,
                        message: "Invalid document ID"
                    });
                }

                if (
                    typeof operationId !== "string" ||
                    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)
                ) {
                    return ack({
                        success: false,
                        statusCode: 400,
                        message: "A valid operationId UUID is required"
                    });
                }

                if (
                    title === undefined &&
                    content === undefined
                ) {
                    return ack({
                        success: false,
                        statusCode: 400,
                        message: "Provide a title or content to update"
                    });
                }

                if (
                    !Number.isInteger(expectedRevision) ||
                    expectedRevision < 1
                ) {
                    return ack({
                        success: false,
                        statusCode: 400,
                        message: "A valid expectedRevision is required"
                    });
                }

                const room = getRoomName(documentId);

                if (!socket.rooms.has(room)) {
                    return ack({
                        success: false,
                        statusCode: 403,
                        message: "Join the document room before updating"
                    });
                }

                const { permission } =
                    await collaborationService.getDocumentAccess({
                        documentId,
                        userId: socket.user.id
                    });

                if (permission === "viewer") {
                    return ack({
                        success: false,
                        statusCode: 403,
                        message: "You do not have permission to update this document"
                    });
                }

                const updateResult =
                await collaborationService.updateDocument({
                    documentId,
                    userId: socket.user.id,
                    title,
                    content,
                    expectedRevision,
                    operationId
                });
                
                if (updateResult.duplicate) {
                    return ack({
                        success: true,
                        message: "Operation already processed",
                        data: updateResult.document,
                        duplicate: true
                    });
                }

                const updatedDocument = updateResult.document;

                await removeUnauthorizedSockets(io, room, documentId);

                io.to(room).emit("document:updated", {
                    document: updatedDocument
                });

                return ack({
                    success: true,
                    message: "Document updated successfully",
                    data: updatedDocument,
                    duplicate: false
                });

            } catch (error) {
                let latestDocument = null;

                if (error.statusCode === 409) {
                    try {
                        const access =
                            await collaborationService.getDocumentAccess({
                                documentId: payload?.documentId,
                                userId: socket.user.id
                            });

                        latestDocument = access.document;
                    } catch (accessError) {
                        
                    }
                }

                return ack({
                    success: false,
                    statusCode: error.statusCode || 500,
                    message: error.message || "Document update failed",
                    ...(latestDocument && {
                        data: {
                            document: latestDocument
                        }
                    })
                });
            }
        });

        
        socket.on("disconnecting", () => {
            for (const room of socket.rooms) {
                if (!room.startsWith("document:")) {
                    continue;
                }

                const documentId = room.slice("document:".length);

                const result = presenceService.removeSocketFromDocument({
                    documentId,
                    userId: socket.user.id,
                    socketId: socket.id
                });

                if (result.isLastConnection) {
                    socket.to(room).emit("user:left", {
                        userId: socket.user.id
                    });
                }
            }
        });

    });
};

module.exports = registerCollaborationSocket;
