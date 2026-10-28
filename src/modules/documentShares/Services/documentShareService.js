
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

module.exports = {
    createDocumentShare
};
