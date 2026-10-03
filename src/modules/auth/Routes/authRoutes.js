const express = require("express");

const authController = require("../Controllers/authController");
const authValidations = require("../Validations/authValidations") ;
const rateLimiter = require("../../../middleware/rateLimitMiddleware") ;

const router = express.Router();

router.post("/register", rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 10
    }) , authValidations.validateRegisterInput , authController.registerUser);

router.post(
    "/login",
    rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 10
    }),
    authValidations.validateLoginInput,
    authController.loginUser
);

module.exports = router;