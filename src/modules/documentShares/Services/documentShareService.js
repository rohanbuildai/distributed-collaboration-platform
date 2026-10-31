
const documentShareModel = require("../Models/documentShareModel");
const documentModel = require("../../documents/Models/documentModel");
const authModel = require("../../auth/Models/authModel");

const AppError = require("../../../utils/errors/appError");

const createDocumentShare = async ({
    documentId,
    sharedWithUserId,
    permission,
    ownerId
}) => {
    const allowedPermissions = ["viewer", "editor"];

    if (!allowedPermissions.includes(permission)) {
        throw new AppError("Invalid permission", 400);
    }

    const user = await authModel.findUserById(sharedWithUserId);

    if (!user) {
        throw new AppError("Recipient user not found", 404);
    }

    if (String(ownerId) === String(sharedWithUserId)) {
        throw new AppError("Cannot share document with yourself", 400);
    }

    const document = await documentModel.findDocumentByIdAndOwner({
        documentId,
        ownerId
    });

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    try {
        return await documentShareModel.createDocumentShare({
            documentId,
            sharedWithUserId,
            permission
        });
    } catch (error) {
        if (error.code === "23505") {
            throw new AppError(
                "Document already shared with this user",
                409
            );
        }

        throw error;
    }
};

const getSharedDocuments = async ({
    sharedWithUserId,
    limit = 10,
    cursor
}) => {

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new AppError("Invalid pagination limit", 400);
    }

    if (cursor) {
        const { createdAt, id } = cursor;

        if (
            typeof id !== "string" ||
            !/^[1-9]\d*$/.test(id) ||
            !createdAt
        ) {
            throw new AppError("Invalid pagination cursor", 400);
        }

        if (Number.isNaN(Date.parse(createdAt))) {
            throw new AppError("Invalid pagination cursor", 400);
        }
    }

    const rows = await documentShareModel.findSharedDocuments({
        sharedWithUserId,
        limit,
        cursor
    });

    const hasNextPage = rows.length > limit;

    const documents = rows.slice(0, limit);

    const lastDocument = documents[documents.length - 1];

    const nextCursor = hasNextPage && lastDocument
        ? {
            createdAt: lastDocument.shared_at,
            id: lastDocument.id
        }
        : null;

    return {
        documents,
        pagination: {
            limit,
            hasNextPage,
            nextCursor
        }
    };
};

module.exports = {
    createDocumentShare ,
    getSharedDocuments
};
