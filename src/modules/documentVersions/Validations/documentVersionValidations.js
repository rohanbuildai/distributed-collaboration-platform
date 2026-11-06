
const AppError = require("../../../utils/errors/appError");

const validateDocumentId = ({ documentId }) => {
    if (
        !documentId ||
        !/^[1-9]\d*$/.test(String(documentId))
    ) {
        throw new AppError("Invalid document ID", 400);
    }

    return documentId;
};

const validateVersionId = ({ versionId }) => {
    if (
        !versionId ||
        !/^[1-9]\d*$/.test(String(versionId))
    ) {
        throw new AppError("Invalid version ID", 400);
    }

    return versionId;
};

const validateVersionPagination = ({
    limit = 10,
    cursor,
}) => {
    const parsedLimit = Number(limit);

    if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
    ) {
        throw new AppError("Invalid pagination limit", 400);
    }

    let parsedCursor = null;

    if (cursor !== undefined && cursor !== null && cursor !== "") {
        parsedCursor = Number(cursor);

        if (
            !Number.isSafeInteger(parsedCursor) ||
            parsedCursor < 1
        ) {
            throw new AppError("Invalid pagination cursor", 400);
        }
    }

    return {
        limit: parsedLimit,
        cursor: parsedCursor,
    };
};


module.exports = {
    validateDocumentId,
    validateVersionId,
    validateVersionPagination,
};
