
import api from "@/services/api";

const shareDocument = async ({ documentId, sharedWithUserId, permission }) => {
    const response = await api.post(
        `/documents/${documentId}/share`,
        {
            sharedWithUserId,
            permission,
        }
    );

    return response.data;
};

const updateSharePermission = async ({
    documentId,
    userId,
    permission,
}) => {
    const response = await api.patch(
        `/documents/${documentId}/share/${userId}`,
        {
            permission,
        }
    );

    return response.data;
};

const revokeDocumentAccess = async ({ documentId, userId }) => {
    const response = await api.delete(
        `/documents/${documentId}/share/${userId}`
    );

    return response.data;
};

const getSharedDocuments = async ({ limit = 10, cursor } = {}) => {
    const response = await api.get("/documents/shared", {
        params: {
            limit,
            ...(cursor ? { cursor } : {}),
        },
    });

    return response.data;
};


const getDocumentShares = async (documentId) => {
    const response = await api.get(`/documents/${documentId}/shares`);

    return response.data;
};


export {
    shareDocument,
    updateSharePermission,
    revokeDocumentAccess,
    getSharedDocuments,
    getDocumentShares
};
