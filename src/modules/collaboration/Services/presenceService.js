
const documentPresence = new Map();

const addSocketToDocument = ({ documentId, userId, socketId }) => {
    const docId = String(documentId);
    const user = String(userId);

    if (!documentPresence.has(docId)) {
        documentPresence.set(docId, new Map());
    }

    const users = documentPresence.get(docId);

    if (!users.has(user)) {
        users.set(user, new Set());
    }

    const sockets = users.get(user);
    const alreadyConnected = sockets.has(socketId);

    sockets.add(socketId);

    return {
        isFirstConnection: !alreadyConnected && sockets.size === 1,
        users: getDocumentPresence(docId)
    };
};

const removeSocketFromDocument = ({
    documentId,
    userId,
    socketId
}) => {
    const docId = String(documentId);
    const user = String(userId);

    const users = documentPresence.get(docId);

    if (!users || !users.has(user)) {
        return {
            wasRemoved: false,
            isLastConnection: false
        };
    }

    const sockets = users.get(user);

    const wasRemoved = sockets.delete(socketId);

    if (!wasRemoved) {
        return {
            wasRemoved: false,
            isLastConnection: false
        };
    }

    const isLastConnection = sockets.size === 0;

    if (isLastConnection) {
        users.delete(user);
    }

    if (users.size === 0) {
        documentPresence.delete(docId);
    }

    return {
        wasRemoved: true,
        isLastConnection
    };
};

const getDocumentPresence = (documentId) => {
    const users = documentPresence.get(String(documentId));

    if (!users) {
        return [];
    }

    return Array.from(users.keys());
};

module.exports = {
    addSocketToDocument,
    removeSocketFromDocument,
    getDocumentPresence
};
