const bcrypt = require("bcrypt");

const authModel = require("../models/authModel");

const registerUser = async ({ name, email, password }) => {

    const existingUser = await authModel.findUserByEmail(
        email
    );

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authModel.createUser({
        name ,
        email ,
        passwordHash
    });

    return user;
};

module.exports = {
    registerUser
};