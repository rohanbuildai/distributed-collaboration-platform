
const collaborationService = require(
    "../Services/collaborationService"
);

const getRoomName = (documentId) => {
    return `document:${documentId}`;
};

const removeUnauthorizedSockets = async (
    io,
    room,
    documentId
) => {
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
            }
        })
    );
};

const registerCollaborationSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.user.id}`);

        // Join a document room.
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

                return ack({
                    success: true,
                    message: "Joined document room",
                    data: {
                        document,
                        permission
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

                await socket.leave(getRoomName(documentId));

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
                    expectedRevision
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

                const updatedDocument =
                    await collaborationService.updateDocument({
                        documentId,
                        userId: socket.user.id,
                        title,
                        content,
                        expectedRevision
                    });

                await removeUnauthorizedSockets(io, room, documentId);

                io.to(room).emit("document:updated", {
                    document: updatedDocument
                });

                return ack({
                    success: true,
                    message: "Document updated successfully",
                    data: updatedDocument
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

        socket.on("disconnect", (reason) => {
            console.log(
                `Socket disconnected: ${socket.user.id}, reason: ${reason}`
            );
        });
    });
};

module.exports = registerCollaborationSocket;
