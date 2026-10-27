const bcrypt = require("bcrypt");
const pool = require("../../../config/database") ;
const crypto = require("crypto");

const authModel = require("../Models/authModel");
const { generateAccessToken } = require("../../../utils/tokens/accessTokenUtils") ;
const { generateRefreshToken,hashRefreshToken } = require("../../../utils/tokens/refreshTokenUtils") ;
const refreshTokenModel = require("../Models/refreshTokenModel") ;
const AppError = require("../../../utils/errors/appError");

const registerUser = async ({ name, email, password }) => {

    const existingUser = await authModel.findUserByEmail(
        email
    );

    if (existingUser) {
        throw new AppError("Email already registered", 409);
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
        throw new AppError("Invalid email or password", 401);
    }

    const comparedPassword = await bcrypt.compare(password, existingUser.password_hash) ;

    if (!comparedPassword) {
        throw new AppError("Invalid email or password", 401);
    }

    const { password_hash, ...safeUser } = existingUser ;

    const accessToken = generateAccessToken(existingUser.id);

    const refreshTokenValue = generateRefreshToken() ;

    const refreshTokenHash = hashRefreshToken(refreshTokenValue) ;

    const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    const client = await pool.connect();

    const familyId = crypto.randomUUID();

    try {
        await client.query("BEGIN");

        await refreshTokenModel.createRefreshToken(
            client,
            {
                userId: existingUser.id,
                tokenHash: refreshTokenHash,
                expiresAt ,
                familyId
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