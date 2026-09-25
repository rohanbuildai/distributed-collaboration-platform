const bcrypt = require("bcrypt");

const authModel = require("../models/authModel");

const registerUser = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authModel.findUserByEmail(
        normalizedEmail
    );

    if (existingUser) {
        const error = new Error("Email already registered");
        error.statusCode = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authModel.createUser({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
    });

    return user;
};

module.exports = {
    registerUser
};