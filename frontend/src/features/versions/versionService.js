
import api from "@/services/api";

const getDocumentVersions = async ({
    documentId,
    limit = 10,
    cursor,
}) => {
    const response = await api.get(
        `/documents/${documentId}/versions`,
        {
            params: {
                limit,
                ...(cursor ? { cursor } : {}),
            },
        }
    );

    return response.data;
};

const getDocumentVersion = async ({ documentId, versionId }) => {
    const response = await api.get(
        `/documents/${documentId}/versions/${versionId}`
    );

    return response.data;
};

const restoreDocumentVersion = async ({ documentId, versionId }) => {
    const response = await api.post(
        `/documents/${documentId}/versions/${versionId}/restore`
    );

    return response.data;
};

export {
    getDocumentVersions,
    getDocumentVersion,
    restoreDocumentVersion,
};
