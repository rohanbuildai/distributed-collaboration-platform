const pool = require("../../../config/database") ;

const createDocumentShare = async ( { documentId , sharedWithUserId , permission } ) => {
    
    const query = `
    INSERT INTO document_shares (document_id,shared_with_user_id,permission)
    VALUES ($1 , $2 , $3 )
    RETURNING id,document_id,shared_with_user_id,permission,created_at` ;

    const values = [ documentId , sharedWithUserId , permission ] ;

    const result = await pool.query( query , values ) ;

    return result.rows[0] ;
}

const findDocumentShare = async ({ documentId , sharedWithUserId }) => {
    const query = `
        SELECT id, document_id, shared_with_user_id, permission
        FROM document_shares
        WHERE document_id = $1
        AND shared_with_user_id = $2
        LIMIT 1;` ;

    const values = [ documentId , sharedWithUserId ] ;

    const result = await pool.query( query , values ) ;

    return result.rows[0] || null ;
}

const findSharedDocuments = async ({
    sharedWithUserId,
    limit,
    cursor
}) => {
    const query = `
        SELECT
            d.id,
            d.owner_id,
            d.title,
            ds.permission,
            ds.created_at AS shared_at
        FROM document_shares ds
        INNER JOIN documents d
            ON d.id = ds.document_id
        WHERE ds.shared_with_user_id = $1
        AND (
            $2::timestamptz IS NULL
            OR (ds.created_at, ds.id) < ($2::timestamptz, $3::bigint)
        )
        ORDER BY ds.created_at DESC, ds.id DESC
        LIMIT $4;
    `;

    const values = [
        sharedWithUserId,
        cursor?.createdAt ?? null,
        cursor?.id ?? null,
        limit + 1
    ];

    const result = await pool.query(query, values);

    return result.rows;
};

module.exports = {
    createDocumentShare ,
    findDocumentShare ,
    findSharedDocuments
}