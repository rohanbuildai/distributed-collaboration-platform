
const AppError = require("../../../utils/errors/appError");

const validateDocumentId = ({ documentId }) => {
    if (
        typeof documentId !== "string" ||
        !/^[1-9]\d*$/.test(documentId)
    ) {
        throw new AppError("Invalid document ID", 400);
    }
};

const validateTitle = ({ title }) => {
    if (typeof title !== "string" || !title.trim()) {
        throw new AppError("Title is required", 400);
    }

    const normalizedTitle = title.trim();

    if (normalizedTitle.length > 200) {
        throw new AppError(
            "Title cannot exceed 200 characters",
            400
        );
    }

    return normalizedTitle;
};

const validateContent = ({ content }) => {
    if (typeof content !== "string") {
        throw new AppError("Content must be a string", 400);
    }

    if (Buffer.byteLength(content, "utf8") > 100000) {
        throw new AppError(
            "Content cannot exceed 100 KB",
            413
        );
    }

    return content;
};

const validateCreateDocument = ({ title, content }) => {
    validateTitle({ title });

    if (content !== undefined) {
        validateContent({ content });
    }
};

const validateUpdateDocument = ({ documentId, title, content }) => {
    validateDocumentId({ documentId });

    if (title === undefined && content === undefined) {
        throw new AppError(
            "Provide a title or content to update",
            400
        );
    }

    if (title !== undefined) {
        validateTitle({ title });
    }

    if (content !== undefined) {
        validateContent({ content });
    }
};

module.exports = {
    validateDocumentId,
    validateTitle,
    validateContent,
    validateCreateDocument,
    validateUpdateDocument
};
