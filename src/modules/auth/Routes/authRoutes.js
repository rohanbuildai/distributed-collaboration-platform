const express = require("express");

const authController = require("../Controllers/authController");
const tokenController = require("../Controllers/tokenController") ;
const authValidations = require("../Validations/authValidations") ;
const rateLimiter = require("../../../middleware/rateLimitMiddleware") ;
const authMiddleware = require("../../../middleware/authMiddleware") ; 

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

router.post(
    "/refresh",
    rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 20
    }),
    tokenController.refreshAccessToken
);

router.post(
    "/logout",
    rateLimiter({
        windowMs: 60 * 1000,
        maxRequests: 20
    }),
    tokenController.logout
);

router.get(
    "/me",
    authMiddleware.authenticate,
    authController.getCurrentUser
);

module.exports = router;