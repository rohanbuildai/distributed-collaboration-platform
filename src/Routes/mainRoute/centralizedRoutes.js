const express = require("express");

const authRoutes = require("../../modules/auth/Routes/authRoutes") ;
const documentRoutes = require("../../modules/documents/Routes/documentRoutes") ;
const documentShareRoutes = require("../../../src/modules/documentShares/Routes/documentShareRoutes") ;
const documentVersionRoutes = require("../../modules/documentVersions/Routes/documentVersionRoutes")

const router = express.Router();

router.use("/auth" , authRoutes ) ;
router.use("/documents" , documentRoutes ) ;
router.use("/documents", documentShareRoutes);
router.use("/documents", documentVersionRoutes);

module.exports = router;