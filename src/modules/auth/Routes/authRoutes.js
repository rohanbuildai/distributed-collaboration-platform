const express = require("express");

const authController = require("../Controllers/authController");
const authValidations = require("../Validations/authValidations") ;

const router = express.Router();

router.post("/register", authValidations.validateRegisterInput , authController.registerUser);

module.exports = router;