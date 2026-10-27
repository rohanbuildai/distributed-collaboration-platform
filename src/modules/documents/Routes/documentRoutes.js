
const express = require("express");

const { authenticate } = require("../../../middleware/authMiddleware");
const rateLimit = require("../../../middleware/rateLimitMiddleware");
const documentController = require("../Controllers/documentController");

const router = express.Router();

const createDocumentLimiter = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20
});

const readDocumentsLimiter = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 60
});

const modifyDocumentLimiter = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30
});

router.post(
    "/",
    authenticate,
    createDocumentLimiter,
    documentController.createDocument
);

router.get(
    "/",
    authenticate,
    readDocumentsLimiter,
    documentController.getDocuments
);

router.get(
    "/:id",
    authenticate,
    readDocumentsLimiter,
    documentController.getDocument
);

router.patch(
    "/:id",
    authenticate,
    modifyDocumentLimiter,
    documentController.updateDocument
);

router.delete(
    "/:id",
    authenticate,
    modifyDocumentLimiter,
    documentController.deleteDocument
);

module.exports = router;
