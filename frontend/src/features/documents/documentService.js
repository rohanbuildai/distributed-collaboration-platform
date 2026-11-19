
import api from "@/services/api";

const getDocuments = async ({ limit = 20, cursor } = {}) => {
    const response = await api.get("/documents", {
        params: {
            limit,
            ...(cursor ? { cursor } : {}),
        },
    });

    return response.data;
};

const createDocument = async ({ title, content }) => {
    const response = await api.post("/documents", {
        title,
        content,
    });

    return response.data;
};

const getDocument = async (documentId) => {
    const response = await api.get(`/documents/${documentId}`);

    return response.data;
};

const updateDocument = async ({
    documentId,
    title,
    content,
    expectedRevision,
    operationId,
}) => {
    const response = await api.patch(`/documents/${documentId}`, {
        title,
        content,
        expectedRevision,
        ...(operationId ? { operationId } : {}),
    });

    return response.data;
};

const deleteDocument = async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);

    return response;
};

export {
    getDocuments,
    createDocument,
    getDocument,
    updateDocument,
    deleteDocument,
};
