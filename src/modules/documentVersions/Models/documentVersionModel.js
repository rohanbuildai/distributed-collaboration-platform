const pool = require("../../../config/database") ;

const createVersion = async ({
    documentId,
    versionNumber,
    title,
    content,
    editedBy,
    client,
}) => {
    const db = client || pool;

    const query = `
        INSERT INTO document_versions (
            document_id,
            version_number,
            title,
            content,
            edited_by
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;

    const values = [
        documentId,
        versionNumber,
        title,
        JSON.stringify(content),
        editedBy,
    ];

    const result = await db.query(query, values);

    return result.rows[0];
};

const getVersions = async ({
    documentId,
    limit,
    cursor,
    client
}) => {
    const db = client || pool;

    const query = `
        SELECT *
        FROM document_versions
        WHERE document_id = $1
        AND ($2::INTEGER IS NULL OR version_number < $2)
        ORDER BY version_number DESC
        LIMIT $3;
    `;

    const values = [
        documentId,
        cursor ?? null,
        limit
    ];

    const result = await db.query(query, values);

    return result.rows;
};

const getVersionById = async ({
    documentId,
    versionId,
    client
}) => {

    const db = client || pool ;

    const query = `
        SELECT *
        FROM document_versions
        WHERE document_id = $1
        AND id = $2;
    `;

    const result = await db.query(query, [
        documentId,
        versionId,
    ]);

    return result.rows[0] || null;
};

const getLatestVersionNumber = async ({
    documentId,
    client
}) => {

    const db = client || pool ;

    const query = `
        SELECT COALESCE(MAX(version_number), 0) AS latest_version
        FROM document_versions
        WHERE document_id = $1;
    `;

    const result = await db.query(query, [documentId]);

    return Number(result.rows[0].latest_version);
};

module.exports = {
    createVersion,
    getVersions,
    getVersionById,
    getLatestVersionNumber,
};