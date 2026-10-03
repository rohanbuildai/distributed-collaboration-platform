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

const loginUser = async ({email, password}) => {
    
    const existingUser = await authModel.findUserByEmail(email) ;

    if (!existingUser) {
        const error = new Error("Invalid email or password") ;
        error.statusCode = 401 ;
        throw error ;
    }

    const comparedPassword = await bcrypt.compare(password, existingUser.password_hash) ;

    if (!comparedPassword) {
        const error = new Error("Invalid email or password") ;
        error.statusCode = 401 ;
        throw error ;
    }

    const { password_hash, ...safeUser } = existingUser ;

    return safeUser ;
}

module.exports = {
    registerUser ,
    loginUser
};