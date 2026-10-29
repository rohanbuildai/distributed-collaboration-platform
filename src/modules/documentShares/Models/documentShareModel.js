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

module.exports = {
    createDocumentShare ,
    findDocumentShare
}