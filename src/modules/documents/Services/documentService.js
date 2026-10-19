
const documentModel = require("../Models/documentModel");
const AppError = require("../../../utils/errors/appError");

const {
    validateDocumentId,
    validateTitle,
    validateContent
} = require("../Validations/documentValidations");

const createDocument = async ({ ownerId, title, content }) => {
    const validTitle = validateTitle({ title });

    const validContent =
        content === undefined
            ? ""
            : validateContent({ content });

    return documentModel.createDocument({
        ownerId,
        title: validTitle,
        content: validContent
    });
};

const getDocuments = async ({ ownerId }) => {
    return documentModel.findDocumentsByOwner({ ownerId });
};

const getDocument = async ({ documentId, ownerId }) => {
    validateDocumentId({ documentId });

    const document = await documentModel.findDocumentByIdAndOwner({
        documentId,
        ownerId
    });

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    return document;
};

const updateDocument = async ({
    documentId,
    ownerId,
    title,
    content
}) => {
    validateDocumentId({ documentId });

    if (title === undefined && content === undefined) {
        throw new AppError(
            "Provide a title or content to update",
            400
        );
    }

    const validTitle =
        title === undefined ? null : validateTitle({ title });

    const validContent =
        content === undefined
            ? null
            : validateContent({ content });

    const document = await documentModel.updateDocument({
        documentId,
        ownerId,
        title: validTitle,
        content: validContent
    });

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    return document;
};

const deleteDocument = async ({ documentId, ownerId }) => {
    validateDocumentId({ documentId });

    const deleted = await documentModel.deleteDocument({
        documentId,
        ownerId
    });

    if (!deleted) {
        throw new AppError("Document not found", 404);
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument
};
