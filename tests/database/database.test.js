
const pool = require("../../src/config/database");

describe("Test database connection", () => {
    afterAll(async () => {
        await pool.end();
    });

    test("connects to the test database", async () => {
        const result = await pool.query(
            "SELECT current_database() AS database_name"
        );

        expect(result.rows[0].database_name).toBe(
            "distributed_collaboration_test"
        );
    });
});
