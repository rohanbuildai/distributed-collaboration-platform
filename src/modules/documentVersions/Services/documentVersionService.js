
const pool = require("../../../config/database") ;

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


const restoreDocumentVersion = async ({
    documentId,
    versionId,
    userId
}) => {
    validateDocumentId({ documentId });
    validateVersionId({ versionId });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const document = await documentModel.findDocumentByIdForUpdate({
            documentId,
            client
        });

        if (!document) {
            throw new AppError("Document not found", 404);
        }

        const isOwner =
            String(document.owner_id) === String(userId);

        if (!isOwner) {
            const documentShare =
                await documentShareModel.findDocumentShare({
                    documentId,
                    sharedWithUserId: userId,
                    client
                });

            if (!documentShare) {
                throw new AppError("Document not found", 404);
            }

            if (documentShare.permission !== "editor") {
                throw new AppError(
                    "You do not have permission to restore this document",
                    403
                );
            }
        }

        const targetVersion =
            await documentVersionModel.getVersionById({
                documentId,
                versionId,
                client
            });

        if (!targetVersion) {
            throw new AppError("Document version not found", 404);
        }

        const latestVersionNumber =
            await documentVersionModel.getLatestVersionNumber({
                documentId,
                client
            });

        const newVersionNumber = latestVersionNumber + 1;

        await documentVersionModel.createVersion({
            documentId,
            versionNumber: newVersionNumber,
            title: document.title,
            content: document.content,
            editedBy: userId,
            client
        });

        const restoredDocument =
            await documentModel.updateDocument({
                documentId,
                title: targetVersion.title,
                content: targetVersion.content,
                client
            });

        if (!restoredDocument) {
            throw new AppError("Document not found", 404);
        }

        await client.query("COMMIT");

        return {
            document: restoredDocument,
            restoredFromVersion: Number(targetVersion.version_number),
            newVersionNumber
        };

    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch (rollbackError) {
            
        }

        throw error;

    } finally {
        client.release();
    }
};


module.exports = {
    getDocumentVersions,
    getDocumentVersion,
    restoreDocumentVersion
};
