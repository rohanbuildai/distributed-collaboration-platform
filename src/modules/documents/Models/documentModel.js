
const pool = require("../../../config/database");

const createDocument = async ({ ownerId, title, content }) => {
    const query = `
        INSERT INTO documents (owner_id, title, content)
        VALUES ($1, $2, $3)
        RETURNING id, owner_id, title, content, created_at, updated_at
    `;

    const values = [ownerId, title, content];
    const result = await pool.query(query, values);

    return result.rows[0];
};


const findDocumentsByOwner = async ({ ownerId, limit, cursor }) => {
    const query = `
        SELECT id, owner_id, title, content, created_at, updated_at
        FROM documents
        WHERE owner_id = $1
          AND (
              $2::timestamptz IS NULL
              OR (updated_at, id) < ($2::timestamptz, $3::bigint)
          )
        ORDER BY updated_at DESC, id DESC
        LIMIT $4
    `;

    const values = [
        ownerId,
        cursor?.updatedAt ?? null,
        cursor?.id ?? null,
        limit + 1
    ];

    const result = await pool.query(query, values);

    return result.rows;
};

const findDocumentByIdAndOwner = async ({ documentId, ownerId }) => {
    const query = `
        SELECT id, owner_id, title, content, created_at, updated_at
        FROM documents
        WHERE id = $1 AND owner_id = $2
        LIMIT 1
    `;

    const values = [documentId, ownerId];
    const result = await pool.query(query, values);

    return result.rows[0] || null;
};

const updateDocument = async ({
    documentId,
    ownerId,
    title,
    content
}) => {
    const query = `
        UPDATE documents
        SET
            title = COALESCE($3, title),
            content = COALESCE($4, content),
            updated_at = NOW()
        WHERE id = $1 AND owner_id = $2
        RETURNING id, owner_id, title, content, created_at, updated_at
    `;

    const values = [documentId, ownerId, title, content];
    const result = await pool.query(query, values);

    return result.rows[0] || null;
};

const deleteDocument = async ({ documentId, ownerId }) => {
    const query = `
        DELETE FROM documents
        WHERE id = $1 AND owner_id = $2
        RETURNING id
    `;

    const values = [documentId, ownerId];
    const result = await pool.query(query, values);

    return result.rowCount > 0;
};


const findDocumentById = async ({ documentId }) => {
    const query = `
        SELECT id, owner_id, title, content, created_at, updated_at
        FROM documents
        WHERE id = $1
        LIMIT 1
    `;

    const values = [documentId];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
};


module.exports = {
    createDocument,
    findDocumentsByOwner,
    findDocumentByIdAndOwner,
    updateDocument,
    deleteDocument ,
    findDocumentById
};
