const express = require("express");

const authRoutes = require("../../modules/auth/Routes/authRoutes") ;
const documentRoutes = require("../../modules/documents/Routes/documentRoutes")

const router = express.Router();

router.use("/auth" , authRoutes ) ;
router.use("/documents" , documentRoutes ) ;

module.exports = router;