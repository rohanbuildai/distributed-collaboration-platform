const pool = require("../../../config/database");

const refreshTokenModel = require("../Models/resfreshTokenModel");

const {
    generateRefreshToken,
    hashRefreshToken
} = require("../../../utils/Tokens/refreshTokenUtils");

const {
    generateAccessToken
} = require("../../../utils/Tokens/accessTokenUtils");

const refreshAccessToken = async (refreshTokenValue) => {
    if (!refreshTokenValue) {
        const error = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
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

        if (!storedToken) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 401;
            throw error;
        }

        if (storedToken.revoked_at) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 401;
            throw error;
        }

        if (new Date(storedToken.expires_at) <= new Date()) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 401;
            throw error;
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
                expiresAt: newExpiresAt
            }
        );

        const accessToken =
            generateAccessToken(storedToken.user_id);

        await client.query("COMMIT");

        return {
            accessToken,
            refreshToken: newRefreshTokenValue
        };
    } catch (error) {
        await client.query("ROLLBACK");
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
