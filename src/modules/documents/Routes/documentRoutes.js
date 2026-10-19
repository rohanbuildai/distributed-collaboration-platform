const express = require("express");

const { authenticate } = require("../../../middleware/authMiddleware");
const documentController = require("../Controllers/documentController");

const router = express.Router();

router.post("/", authenticate, documentController.createDocument);
router.get("/", authenticate, documentController.getDocuments);
router.get("/:id", authenticate,documentController.getDocument);
router.patch("/:id", authenticate,documentController.updateDocument);
router.delete("/:id", authenticate,documentController.deleteDocument);

module.exports = router;