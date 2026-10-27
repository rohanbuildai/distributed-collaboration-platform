
const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,

    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
});

pool.on("error", (error) => {
    console.error("Unexpected error on idle PostgreSQL client:", error);
});

module.exports = pool;
