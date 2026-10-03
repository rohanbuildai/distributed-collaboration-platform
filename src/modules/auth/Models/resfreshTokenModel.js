const createRefreshToken = async (
    client ,
    {
        userId,
        tokenHash,
        expiresAt
}) => {
    const query = `
        INSERT INTO refresh_tokens (
            user_id,
            token_hash,
            expires_at
        )
        VALUES ($1, $2, $3)
        RETURNING id, user_id, expires_at, created_at
    `;

    const result = await client.query(query, [
        userId,
        tokenHash,
        expiresAt
    ]);

    return result.rows[0];
};

const findRefreshTokenForUpdate = async (
    client,
    tokenHash
) => {
    const query = `
        SELECT
            id,
            user_id,
            token_hash,
            expires_at,
            revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
        FOR UPDATE
    `;

    const result = await client.query(query, [tokenHash]);

    return result.rows[0] || null;
};

const revokeRefreshToken = async (
    client,
    tokenId
) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE id = $1
          AND revoked_at IS NULL
    `;

    await client.query(query, [tokenId]);
};

module.exports = {
    createRefreshToken ,
    findRefreshTokenForUpdate ,
    revokeRefreshToken
};