const express = require("express");

const authController = require("../Controllers/authController");
const authValidations = require("../Validations/authValidations") ;
const rateLimiter = require("../../../middleware/rateLimitMiddleware") ;

const router = express.Router();

router.post("/register", rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 10
    }) , authValidations.validateRegisterInput , authController.registerUser);

module.exports = router;