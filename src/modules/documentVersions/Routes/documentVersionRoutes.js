const express = require("express");

const { authenticate } = require("../../../middleware/authMiddleware");
const rateLimit = require("../../../middleware/rateLimitMiddleware");

const documentVersionController = require("../Controllers/documentVersionController");

const router = express.Router();

const documentVersionLimiter = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 30
});

router.get(
    "/:documentId/versions",
    authenticate,
    documentVersionLimiter,
    documentVersionController.getDocumentVersions
);

router.get(
    "/:documentId/versions/:versionId",
    authenticate,
    documentVersionLimiter,
    documentVersionController.getDocumentVersion
);

module.exports = router;