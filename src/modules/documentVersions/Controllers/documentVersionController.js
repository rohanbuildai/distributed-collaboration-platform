const documentVersionService = require("../Services/documentVersionService");


const getDocumentVersions = async (req, res, next) => {
    try {
        const { documentId } = req.params;
        const { limit, cursor } = req.query;
        const userId = req.user.id;

        const result = await documentVersionService.getDocumentVersions({
            documentId,
            userId,
            limit,
            cursor,
        });

        return res.status(200).json({
            success: true,
            message: "Document version history fetched successfully",
            data: result.versions,
            pagination: result.pagination,
        });
    } catch (error) {
        next(error);
    }
};

const getDocumentVersion = async (req, res, next) => {
    try {
        const { documentId, versionId } = req.params;
        const userId = req.user.id;

        const version = await documentVersionService.getDocumentVersion({
            documentId,
            versionId,
            userId,
        });

        return res.status(200).json({
            success: true,
            message: "Document version fetched successfully",
            data: version,
        });
    } catch (error) {
        next(error);
    }
};


const restoreDocumentVersion = async (req, res, next) => {
    try {
        const { documentId, versionId } = req.params;
        const userId = req.user.id;

        const result =
            await documentVersionService.restoreDocumentVersion({
                documentId,
                versionId,
                userId
            });

        return res.status(200).json({
            success: true,
            message: "Document restored successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    getDocumentVersions,
    getDocumentVersion,
    restoreDocumentVersion
};