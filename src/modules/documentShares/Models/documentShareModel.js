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

module.exports = {
    createDocumentShare
}