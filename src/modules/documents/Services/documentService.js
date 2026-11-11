
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
    expectedRevision
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

        if (document.revision !== expectedRevision) {
            throw new AppError(
                "Document has been modified. Fetch the latest version before updating.",
                409
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
        );
}

        await client.query("COMMIT");

        return updatedDocument;

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
