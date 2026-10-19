const express = require("express");

const authRoutes = require("../../src/modules/auth/Routes/authRoutes") ;
const documentRoutes = require("../../src/modules/documents/Routes/documentRoutes")

const router = express.Router();

router.use("/auth" , authRoutes ) ;
router.use("/documents" , documentRoutes ) ;

module.exports = router;