
const documentModel = require("../Models/documentModel");
const documentShareModel = require("../../documentShares/Models/documentShareModel");
const documentVersionModel = require("../../documentVersions/Models/documentVersionModel");
const AppError = require("../../../utils/errors/appError");
const pool = require("../../../config/database") ;

const {
    validateDocumentId,
    validateTitle,
    validateContent ,
    validateDocumentPagination
} = require("../Validations/documentValidations");

const createDocument = async ({ ownerId, title, content }) => {
    const validTitle = validateTitle({ title });

    const defaultContent = {
        type: "doc",
        content: [
            {
                type: "paragraph",
            },
        ],
    };

    const validContent =
        content === undefined
            ? defaultContent
            : validateContent({ content });

    return documentModel.createDocument({
        ownerId,
        title: validTitle,
        content: validContent
    });
};

const getDocuments = async ({ ownerId , limit , cursor }) => {

    const pagination = validateDocumentPagination({ limit , cursor }) ;
    const rows = await documentModel.findDocumentsByOwner({
        ownerId ,
        limit : pagination.limit ,
        cursor : pagination.cursor
    })

    const hasMore = rows.length > pagination.limit ;      // if documents are available next
    const documents =  rows.slice(0,pagination.limit) ;   // removes extra response from the object

    const lastDocument = documents[documents.length - 1];  
    const nextCursor =
        hasMore && lastDocument
            ? Buffer.from(
                  JSON.stringify({
                      updatedAt: lastDocument.updated_at,
                      id: String(lastDocument.id)
                  })
              ).toString("base64")
            : null;

    return {
        documents,
        pagination: {
            limit: pagination.limit,
            hasMore,
            nextCursor
        }
    };
};


const getDocument = async ({ documentId, ownerId }) => {
    validateDocumentId({ documentId });

    const document = await documentModel.findDocumentById({
        documentId
    });

    if (!document) {
        throw new AppError("Document not found", 404);
    }

    if (String(document.owner_id) === String(ownerId)) {
        return document;
    }

    const documentShare = await documentShareModel.findDocumentShare({
        documentId,
        sharedWithUserId: ownerId
    });

    if (!documentShare) {
        throw new AppError("Document not found", 404);
    }

    return document;
};

const updateDocument = async ({
    documentId,
    ownerId,
    title,
    content ,
    expectedRevision ,
    operationId
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
    
    if (
        !Number.isInteger(expectedRevision) ||
        expectedRevision < 1
    ) {
        throw new AppError(
            "A valid expectedRevision is required",
            400
        );
    }

    if (
        operationId !== undefined &&
        operationId !== null &&
        (
            typeof operationId !== "string" ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)
        )
    ) {
        throw new AppError("Invalid operation ID", 400);
    }

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
            String(document.owner_id) === String(ownerId);

        if (!isOwner) {
            const documentShare = await documentShareModel.findDocumentShare({
                documentId,
                sharedWithUserId: ownerId ,
                client
            });

            if (!documentShare) {
                throw new AppError("Document not found", 404);
            }

            if (documentShare.permission !== "editor") {
                throw new AppError(
                    "You do not have permission to update this document",
                    403
                );
            }
        }

        let requestPayload = null;

        if (operationId) {
            requestPayload = {
                title: validTitle,
                content: validContent,
                expectedRevision
            };

            const existingOperation =
                await documentModel.findDocumentOperation({
                    documentId,
                    userId: ownerId,
                    operationId,
                    requestPayload,
                    client
                });

            if (existingOperation) {
                if (!existingOperation.payload_matches) {
                    throw new AppError(
                        "Operation ID has already been used with a different payload",
                        409
                    );
                }

                if (!existingOperation.response_payload) {
                    throw new AppError(
                        "Stored operation response is unavailable",
                        500
                    );
                }

                await client.query("COMMIT");

                return {
                    document: existingOperation.response_payload,
                    duplicate: true
                };
            }
        }

        if (document.revision !== expectedRevision) {
            throw new AppError(
                "Document has been modified. Fetch the latest version before updating.",
                409
            );
        }

        if (
            operationId !== undefined &&
            (
                typeof operationId !== "string" ||
                !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operationId)
            )
        ) {
            throw new AppError(
                "A valid operationId UUID is required",
                400
            );
        }

        const latestVersionNumber =
            await documentVersionModel.getLatestVersionNumber({
                documentId,
                client
            });

        const nextVersionNumber = latestVersionNumber + 1;

        await documentVersionModel.createVersion({
            documentId,
            versionNumber: nextVersionNumber,
            title: document.title,
            content: document.content,
            editedBy: ownerId,
            client
        });

        const updatedDocument = await documentModel.updateDocument({
            documentId,
            title: validTitle,
            content: validContent,
            expectedRevision ,
            client
        });

        if (!updatedDocument) {
            throw new AppError(
                "Document update failed. Please retry.",
                409
        )};

        if (operationId) {
            await documentModel.createDocumentOperation({
                documentId,
                userId: ownerId,
                operationId,
                requestPayload,
                responsePayload: updatedDocument,
                client
            });
        }

        await client.query("COMMIT");

        return operationId
        ? {
            document: updatedDocument,
            duplicate: false
        }
        : updatedDocument;

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
