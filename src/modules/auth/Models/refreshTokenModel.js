const createRefreshToken = async (
    client ,
    {
        userId,
        tokenHash,
        expiresAt ,
        familyId
}) => {
    const query = `
        INSERT INTO refresh_tokens (
            user_id,
            token_hash,
            expires_at ,
            family_id
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id, expires_at, created_at, family_id
    `;

    const result = await client.query(query, [
        userId,
        tokenHash,
        expiresAt ,
        familyId
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
            revoked_at ,
            family_id
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


const revokeRefreshTokenFamily = async (client, familyId) => {
    const query = `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE family_id = $1
          AND revoked_at IS NULL
    `;

    await client.query(query, [familyId]);
};

module.exports = {
    createRefreshToken ,
    findRefreshTokenForUpdate ,
    revokeRefreshToken ,
    revokeRefreshTokenFamily
};