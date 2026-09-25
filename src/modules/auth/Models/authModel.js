const pool = require("../../../config/database");

const findUserByEmail = async (email) => {
    const query = `
        SELECT id, name, email, password_hash, created_at, updated_at
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
    `;

    const values = [ email ] ;

    const result = await pool.query(query, values);

    return result.rows[0] || null;
};

const createUser = async ({ name, email, passwordHash }) => {
    const query = `
        INSERT INTO users (
            name,
            email,
            password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at, updated_at
    `;

    const values = [ name , email , passwordHash ] ;

    const result = await pool.query(query, values) ;

    return result.rows[0];
};

module.exports = {
    findUserByEmail,
    createUser
};