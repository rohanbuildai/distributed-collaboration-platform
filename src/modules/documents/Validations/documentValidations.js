
const AppError = require("../../../utils/errors/appError");
const { validateRichTextDocument } = require("./documentSchema") ;

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
    if (
        typeof content !== "object" ||
        content === null ||
        Array.isArray(content)
    ) {
        throw new AppError(
            "Content must be a valid document object",
            400
        );
    }

    const contentSize = Buffer.byteLength(
        JSON.stringify(content),
        "utf8"
    );

    if (contentSize > 100000) {
        throw new AppError(
            "Content cannot exceed 100 KB",
            413
        );
    }

    try {
        return validateRichTextDocument(content);
    } catch (error) {
        throw new AppError(
            "Invalid rich-text document structure",
            400
        );
    }
};


const validateDocumentPagination = ({ limit, cursor }) => {
    let parsedLimit = 20;

    if (limit !== undefined) {
        if (
            typeof limit !== "string" ||
            !/^\d+$/.test(limit)
        ) {
            throw new AppError(
                "Limit must be an integer between 1 and 100",
                400
            );
        }

        parsedLimit = Number(limit);
    }

    if (
        !Number.isSafeInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
    ) {
        throw new AppError(
            "Limit must be an integer between 1 and 100",
            400
        );
    }

    let parsedCursor = null;

    if (cursor !== undefined) {
        if (
            typeof cursor !== "string" ||
            !cursor ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cursor)
        ) {
            throw new AppError("Invalid cursor", 400);
        }

        try {
            const decoded = Buffer.from(cursor, "base64").toString("utf8");

            if (Buffer.from(decoded, "utf8").toString("base64") !== cursor) {
                throw new Error("Non-canonical Base64");
            }

            parsedCursor = JSON.parse(decoded);
        } catch {
            throw new AppError("Invalid cursor", 400);
        }

        if (
            !parsedCursor ||
            typeof parsedCursor !== "object" ||
            Array.isArray(parsedCursor) ||
            typeof parsedCursor.updatedAt !== "string" ||
            !Number.isFinite(Date.parse(parsedCursor.updatedAt)) ||
            typeof parsedCursor.id !== "string" ||
            !/^[1-9]\d*$/.test(parsedCursor.id) ||
            !Number.isSafeInteger(Number(parsedCursor.id))
        ) {
            throw new AppError("Invalid cursor", 400);
        }
    }

    return {
        limit: parsedLimit,
        cursor: parsedCursor
    };
};



module.exports = {
    validateDocumentId,
    validateTitle,
    validateContent,
    validateDocumentPagination
};
