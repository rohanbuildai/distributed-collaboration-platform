
const documentShareService = require("../Services/documentShareService");

const createDocumentShare = async (req, res, next) => {
    try {
        const sharedDocument = await documentShareService.createDocumentShare({
            documentId: req.params.id,
            ownerId: req.user.id,
            sharedWithUserId: req.body.sharedWithUserId,
            permission: req.body.permission
        });

        return res.status(201).json({
            success: true,
            message: "Document shared successfully",
            data: sharedDocument
        });
    } catch (error) {
        next(error);
    }
};

const updateDocumentSharePermission = async (req, res, next) => {
    try {
        const updatedShare = await documentShareService.updateDocumentSharePermission({
            documentId: req.params.id,
            ownerId: req.user.id,
            sharedWithUserId: req.params.userId,
            permission: req.body.permission
        });

        return res.status(200).json({
            success: true,
            message: "Document sharing permission updated successfully",
            data: updatedShare
        });

    } catch (error) {
        next(error);
    }
};

const revokeDocumentShare = async (req, res, next) => {
    try {
        const deletedShare = await documentShareService.revokeDocumentShare({
            documentId: req.params.id,
            ownerId: req.user.id,
            sharedWithUserId: req.params.userId
        });

        return res.status(200).json({
            success: true,
            message: "Document sharing revoked successfully",
            data: deletedShare
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createDocumentShare ,
    updateDocumentSharePermission ,
    revokeDocumentShare
};
