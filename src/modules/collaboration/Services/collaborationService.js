
const documentService = require(
    "../../documents/Services/documentService"
);

const documentShareModel = require(
    "../../documentShares/Models/documentShareModel"
);

const AppError = require(
    "../../../utils/errors/appError"
);

const getDocumentAccess = async ({ documentId, userId }) => {

    const document = await documentService.getDocument({
        documentId,
        ownerId: userId
    });

    if (String(document.owner_id) === String(userId)) {
        return {
            document,
            permission: "owner"
        };
    }

    const documentShare = await documentShareModel.findDocumentShare({
        documentId,
        sharedWithUserId: userId
    });

    if (!documentShare) {
        throw new AppError("Document not found", 404);
    }

    return {
        document,
        permission: documentShare.permission
    };
};


const updateDocument = async ({
    documentId,
    userId,
    title,
    content,
    expectedRevision,
    operationId
}) => {
    return documentService.updateDocument({
        documentId,
        ownerId: userId,
        title,
        content,
        expectedRevision,
        operationId
    });
};


module.exports = {
    getDocumentAccess,
    updateDocument
};
