const bcrypt = require("bcrypt");
const pool = require("../../../config/database") ;

const authModel = require("../models/authModel");
const { generateAccessToken } = require("../../../utils/Tokens/accessTokenUtils") ;
const { generateRefreshToken,hashRefreshToken } = require("../../../utils/Tokens/refreshTokenUtils") ;
const refreshTokenModel = require("../Models/resfreshTokenModel") ;

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

    const accessToken = generateAccessToken(existingUser.id);

    const refreshTokenValue = generateRefreshToken() ;

    const refreshTokenHash = hashRefreshToken(refreshTokenValue) ;

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await refreshTokenModel.createRefreshToken(
            client,
            {
                userId: existingUser.id,
                tokenHash: refreshTokenHash,
                expiresAt
            }
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    return {
        user : safeUser ,
        accessToken ,
        refreshToken : refreshTokenValue
    } ;
}

module.exports = {
    registerUser ,
    loginUser ,
};