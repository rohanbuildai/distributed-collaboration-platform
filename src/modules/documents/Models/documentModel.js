
const pool = require("../../../config/database");

const createDocument = async ({ ownerId, title, content }) => {
    const query = `
        INSERT INTO documents (owner_id, title, content)
        VALUES ($1, $2, $3)
        RETURNING id, owner_id, title, content, revision, created_at, updated_at
    `;

    const values = [ownerId, title, content];
    const result = await pool.query(query, values);

    return result.rows[0];
};


const findDocumentsByOwner = async ({ ownerId, limit, cursor }) => {
    const query = `
        SELECT id, owner_id, title, content, revision,  created_at, updated_at
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
        SELECT id, owner_id, title, content, revision,  created_at, updated_at
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
    title,
    content,
    expectedRevision,
    client
}) => {
    const query = `
        UPDATE documents
        SET
            title = COALESCE($2, title),
            content = COALESCE($3, content),
            revision = revision + 1,
            updated_at = NOW()
        WHERE
            id = $1
            AND revision = $4
        RETURNING
            id,
            owner_id,
            title,
            content,
            revision,
            created_at,
            updated_at;
    `;

    const db = client || pool;

    const values = [
        documentId,
        title,
        content,
        expectedRevision
    ];

    const result = await db.query(query, values);

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
        SELECT id, owner_id, title, content, revision, created_at, updated_at
        FROM documents
        WHERE id = $1
        LIMIT 1
    `;

    const values = [documentId];

    const result = await pool.query(query, values);

    return result.rows[0] || null;
};

const findDocumentByIdForUpdate = async ({ documentId, client }) => {
    const query = `
        SELECT id, owner_id, title, content, revision, created_at, updated_at
        FROM documents
        WHERE id = $1
        FOR UPDATE
    `;

    const result = await client.query(query, [documentId]);

    return result.rows[0] || null;
};


const findDocumentOperation = async ({
    documentId,
    userId,
    operationId,
    requestPayload,
    client
}) => {
    const query = `
        SELECT
            id,
            request_payload,
            response_payload,
            request_payload = $4::jsonb AS payload_matches
        FROM document_operations
        WHERE
            document_id = $1
            AND user_id = $2
            AND operation_id = $3
        LIMIT 1
    `;

    const values = [
        documentId,
        userId,
        operationId,
        JSON.stringify(requestPayload)
    ];

    const result = await client.query(query, values);

    return result.rows[0] || null;
};


const createDocumentOperation = async ({
    documentId,
    userId,
    operationId,
    requestPayload,
    responsePayload,
    client
}) => {
    const query = `
        INSERT INTO document_operations (
            document_id,
            user_id,
            operation_id,
            request_payload,
            response_payload
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING id, created_at
    `;

    const values = [
        documentId,
        userId,
        operationId,
        JSON.stringify(requestPayload),
        JSON.stringify(responsePayload)
    ];

    const result = await client.query(query, values);

    return result.rows[0];
};




module.exports = {
    createDocument,
    findDocumentsByOwner,
    findDocumentByIdAndOwner,
    updateDocument,
    deleteDocument ,
    findDocumentById ,
    findDocumentByIdForUpdate ,
    findDocumentOperation ,
    createDocumentOperation
};
