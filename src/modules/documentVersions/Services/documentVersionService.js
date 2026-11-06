
const documentVersionModel = require("../Models/documentVersionModel");
const documentModel = require("../../documents/Models/documentModel");
const documentShareModel = require("../../documentShares/Models/documentShareModel");

const AppError = require("../../../utils/errors/appError");

const {
    validateDocumentId,
    validateVersionId,
    validateVersionPagination,
} = require("../Validations/documentVersionValidations");

const getAccessibleDocument = async ({
    documentId,
    userId,
}) => {
    validateDocumentId({ documentId });

    const document = await documentModel.findDocumentById({
        documentId,
    });

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    if (String(document.owner_id) === String(userId)) {
        return {
            document,
            permission: "owner",
        };
    }

    const documentShare = await documentShareModel.findDocumentShare({
        documentId,
        sharedWithUserId: userId,
    });

    if (!documentShare) {
        throw new AppError("Document not found", 404);
    }

    return {
        document,
        permission: documentShare.permission,
    };
};

const getDocumentVersions = async ({
    documentId,
    userId,
    limit = 10,
    cursor,
}) => {
   
    validateDocumentId({ documentId });

    const pagination = validateVersionPagination({
        limit,
        cursor,
    });

    await getAccessibleDocument({
        documentId,
        userId,
    });

    const rows = await documentVersionModel.getVersions({
        documentId,
        limit: pagination.limit + 1,
        cursor: pagination.cursor,
    });

    const hasNextPage = rows.length > pagination.limit;

    const versions = rows.slice(0, pagination.limit);

    const lastVersion = versions[versions.length - 1];

    const nextCursor =
        hasNextPage && lastVersion
            ? Number(lastVersion.version_number)
            : null;

    return {
        versions,
        pagination: {
            limit: pagination.limit,
            hasNextPage,
            nextCursor,
        },
    };
};

const getDocumentVersion = async ({
    documentId,
    versionId,
    userId,
}) => {

    validateDocumentId({ documentId });
    validateVersionId({ versionId });

    await getAccessibleDocument({
        documentId,
        userId,
    });

    const version = await documentVersionModel.getVersionById({
        documentId,
        versionId,
    });

    if (!version) {
        throw new AppError("Document version not found", 404);
    }

    return version;
};


module.exports = {
    getDocumentVersions,
    getDocumentVersion,
};
