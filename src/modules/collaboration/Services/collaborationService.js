
const documentService = require(
    "../../documents/Services/documentService"
);

const documentShareModel = require(
    "../../documentShares/Models/documentShareModel"
);

const AppError = require(
    "../../../utils/errors/appError"
);
const { updateDocument } = require("../../documents/Models/documentModel");

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

const updateDocument = async ({
    documentId,
    userId,
    title,
    content,
    expectedRevision
}) => {
    return documentService.updateDocument({
        documentId,
        ownerId: userId,
        title,
        content,
        expectedRevision
    });
};

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

module.exports = {
    getDocumentAccess ,
    updateDocument
};
