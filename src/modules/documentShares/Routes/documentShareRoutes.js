
const express = require("express");

const { authenticate } = require("../../../middleware/authMiddleware");
const rateLimit = require("../../../middleware/rateLimitMiddleware");
const documentShareController = require("../Controllers/documentShareController");

const router = express.Router();

const shareDocumentLimiter = rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20
});

router.post(
    "/:id/share",
    authenticate,
    shareDocumentLimiter,
    documentShareController.createDocumentShare
);

module.exports = router;
