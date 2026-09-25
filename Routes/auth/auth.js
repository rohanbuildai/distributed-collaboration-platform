const express = require("express");

const authRoutes = require("../../src/modules/auth/Routes/authRoutes") ;

const router = express.Router();

router.use("/auth" , authRoutes ) ;

module.exports = router;