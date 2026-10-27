const pool = require("../../../config/database");
const AppError = require("../../../utils/errors/appError");

const refreshTokenModel = require("../Models/refreshTokenModel");

const {
    generateRefreshToken,
    hashRefreshToken
} = require("../../../utils/tokens/refreshTokenUtils");

const {
    generateAccessToken
} = require("../../../utils/tokens/accessTokenUtils");

const refreshAccessToken = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        throw new AppError("Invalid refresh token", 401);
    }

    const tokenHash = hashRefreshToken(refreshTokenValue);

    const client = await pool.connect();

    let transactionOpen = false ;

    try {
        await client.query("BEGIN");
        transactionOpen = true ;

        const storedToken =
            await refreshTokenModel.findRefreshTokenForUpdate(
                client,
                tokenHash
            );

        if (!storedToken) {
            await client.query("ROLLBACK") ;
            transactionOpen = false ;
            throw new AppError("Invalid refresh token", 401);
        }

        if (storedToken.revoked_at) {
            await refreshTokenModel.revokeRefreshTokenFamily(
                client,
                storedToken.family_id
            );

            await client.query("COMMIT");
            transactionOpen = false;

            throw new AppError("Invalid refresh token", 401);
        }

        if (new Date(storedToken.expires_at) <= new Date()) {
            throw new AppError("Invalid refresh token", 401);
        }

        const newRefreshTokenValue =
            generateRefreshToken();

        const newRefreshTokenHash =
            hashRefreshToken(newRefreshTokenValue);

        const newExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await refreshTokenModel.revokeRefreshToken(
            client,
            storedToken.id
        );

        await refreshTokenModel.createRefreshToken(
            client,
            {
                userId: storedToken.user_id,
                tokenHash: newRefreshTokenHash,
                expiresAt: newExpiresAt,
                familyId: storedToken.family_id
            }
        );

        const accessToken =
            generateAccessToken(storedToken.user_id);

        await client.query("COMMIT");
        transactionOpen = false ;

        return {
            accessToken,
            refreshToken: newRefreshTokenValue
        };
    } catch (error) {
        if (transactionOpen) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {

                console.error(
                    "Refresh-token transaction rollback failed",
                    rollbackError
                );
            }
        }

        throw error;
    } finally {
        client.release();
    }
};

const logout = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        return;
    }

    const tokenHash = hashRefreshToken(refreshTokenValue);

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const storedToken =
            await refreshTokenModel.findRefreshTokenForUpdate(
                client,
                tokenHash
            );

        if (storedToken) {
            await refreshTokenModel.revokeRefreshToken(
                client,
                storedToken.id
            );
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    refreshAccessToken ,
    logout
};