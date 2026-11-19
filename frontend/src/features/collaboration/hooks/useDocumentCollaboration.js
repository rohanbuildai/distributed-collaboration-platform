
"use client";

import { useCallback, useEffect, useState } from "react";
import { connectSocket } from "@/services/socketService";

const useDocumentCollaboration = (documentId) => {
    const [socket, setSocket] = useState(null);
    const [document, setDocument] = useState(null);
    const [permission, setPermission] = useState(null);
    const [presence, setPresence] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isJoining, setIsJoining] = useState(true);
    const [error, setError] = useState("");

    const joinDocument = useCallback((socketInstance) => {
        if (!socketInstance.connected) return;

        setIsJoining(true);
        setError("");

        socketInstance.emit(
            "document:join",
            { documentId: String(documentId) },
            (response) => {
                if (!response?.success) {
                    setError(
                        response?.message || "Unable to join document."
                    );
                    setIsJoining(false);
                    return;
                }

                setDocument(response.data.document);
                setPermission(response.data.permission);
                setPresence(response.data.presence || []);
                setIsJoining(false);
            }
        );
    }, [documentId]);

    const updateDocument = useCallback(
        ({ title, content, expectedRevision }) => {
            return new Promise((resolve, reject) => {
                if (!socket?.connected) {
                    reject(new Error("Socket is not connected."));
                    return;
                }

                if (!["owner", "editor"].includes(permission)) {
                    reject(
                        new Error(
                            "You do not have permission to edit this document."
                        )
                    );
                    return;
                }

                const operationId = crypto.randomUUID();

                socket.emit(
                    "document:update",
                    {
                        documentId: String(documentId),
                        title,
                        content,
                        expectedRevision,
                        operationId,
                    },
                    (response) => {
                        if (!response?.success) {
                            if (
                                response?.statusCode === 409 &&
                                response?.data?.document
                            ) {
                                setDocument(response.data.document);
                            }

                            reject(
                                Object.assign(
                                    new Error(
                                        response?.message ||
                                        "Document update failed."
                                    ),
                                    {
                                        statusCode: response?.statusCode,
                                    }
                                )
                            );

                            return;
                        }

                        setDocument(response.data);
                        resolve(response.data);
                    }
                );
            });
        },
        [socket, permission, documentId]
    );

    useEffect(() => {
        if (!documentId) return;

        const socketInstance = connectSocket();

        setSocket(socketInstance);

        const handleConnect = () => {
            setIsConnected(true);
            joinDocument(socketInstance);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            setIsJoining(true);
        };

        const handleConnectError = (connectionError) => {
            setError(
                connectionError.message || "Socket connection failed."
            );
            setIsJoining(false);
        };

        const handleDocumentUpdated = (payload) => {
            if (payload?.document) {
                setDocument(payload.document);
            }
        };

        const handleUserJoined = ({ userId } = {}) => {
            if (!userId) return;

            setPresence((previous) =>
                previous.includes(String(userId))
                    ? previous
                    : [...previous, String(userId)]
            );
        };

        const handleUserLeft = ({ userId } = {}) => {
            if (!userId) return;

            setPresence((previous) =>
                previous.filter((id) => id !== String(userId))
            );
        };

        socketInstance.on("connect", handleConnect);
        socketInstance.on("disconnect", handleDisconnect);
        socketInstance.on("connect_error", handleConnectError);
        socketInstance.on("document:updated", handleDocumentUpdated);
        socketInstance.on("user:joined", handleUserJoined);
        socketInstance.on("user:left", handleUserLeft);

        if (socketInstance.connected) {
            handleConnect();
        }

        return () => {
            socketInstance.off("connect", handleConnect);
            socketInstance.off("disconnect", handleDisconnect);
            socketInstance.off("connect_error", handleConnectError);
            socketInstance.off("document:updated", handleDocumentUpdated);
            socketInstance.off("user:joined", handleUserJoined);
            socketInstance.off("user:left", handleUserLeft);

            if (socketInstance.connected) {
                socketInstance.emit("document:leave", {
                    documentId: String(documentId),
                });
            }
        };
    }, [documentId, joinDocument]);

    return {
        socket,
        document,
        setDocument,
        permission,
        presence,
        isConnected,
        isJoining,
        error,
        updateDocument,
    };
};

export default useDocumentCollaboration;
