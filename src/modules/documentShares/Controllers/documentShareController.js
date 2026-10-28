
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

module.exports = {
    createDocumentShare
};
