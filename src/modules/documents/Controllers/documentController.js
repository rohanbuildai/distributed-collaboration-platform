
const documentService = require("../Services/documentService");
const documentShareService = require("../../documentShares/Services/documentShareService");

const createDocument = async (req, res, next) => {
    try {
        const document = await documentService.createDocument({
            ownerId: req.user.id,
            title: req.body.title,
            content: req.body.content
        });

        return res.status(201).json({
            success: true,
            message: "Document created successfully",
            data: document
        });
    } catch (error) {
        next(error);
    }
};


const getDocuments = async (req, res, next) => {
    try {
        const result = await documentService.getDocuments({
            ownerId: req.user.id,
            limit: req.query.limit,
            cursor: req.query.cursor
        });

        return res.status(200).json({
            success: true,
            data: result.documents,
            pagination: result.pagination
        });
    } catch (error) {
        next(error);
    }
};

const getDocument = async (req, res, next) => {
    try {
        const document = await documentService.getDocument({
            documentId: req.params.id,
            ownerId: req.user.id
        });

        return res.status(200).json({
            success: true,
            data: document
        });
    } catch (error) {
        next(error);
    }
};

const updateDocument = async (req, res, next) => {
    try {
        const document = await documentService.updateDocument({
            documentId: req.params.id,
            ownerId: req.user.id,
            title: req.body.title,
            content: req.body.content
        });

        return res.status(200).json({
            success: true,
            message: "Document updated successfully",
            data: document
        });
    } catch (error) {
        next(error);
    }
};

const deleteDocument = async (req, res, next) => {
    try {
        await documentService.deleteDocument({
            documentId: req.params.id,
            ownerId: req.user.id
        });

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
};

const getSharedDocuments = async (req, res, next) => {
    try {
        const result = await documentShareService.getSharedDocuments({
            sharedWithUserId: req.user.id,
            limit: req.query.limit ? Number(req.query.limit) : 10,
            cursor: req.query.cursor
                ? JSON.parse(
                    Buffer.from(req.query.cursor, "base64").toString("utf-8")
                )
                : null
        });

        return res.status(200).json({
            success: true,
            data: result.documents,
            pagination: {
                limit: result.pagination.limit,
                hasNextPage: result.pagination.hasNextPage,
                nextCursor: result.pagination.nextCursor
                    ? Buffer.from(
                        JSON.stringify(result.pagination.nextCursor)
                    ).toString("base64")
                    : null
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDocument,
    getDocuments,
    getDocument,
    updateDocument,
    deleteDocument ,
    getSharedDocuments
};
