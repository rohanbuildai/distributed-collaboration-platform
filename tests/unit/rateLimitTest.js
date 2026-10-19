
const assert = require("node:assert/strict");

const cleanupExpiredRequests = require("../../src/utils/requests/cleanupExpiredRequests");

const testCleanupExpiredRequests = () => {
    const requests = new Map([
        [
            "192.168.1.1",
            { count: 3, expiresAt: 1000 }
        ],
        [
            "192.168.1.2",
            { count: 2, expiresAt: 2000 }
        ],
        [
            "192.168.1.3",
            { count: 1, expiresAt: 3000 }
        ]
    ]);

    cleanupExpiredRequests(requests, 2000);

    // Expired entry should be deleted.
    assert.equal(requests.has("192.168.1.1"), false);

    // Entry at the exact expiry time should also be deleted.
    assert.equal(requests.has("192.168.1.2"), false);

    // Future expiry should remain.
    assert.equal(requests.has("192.168.1.3"), true);

    assert.equal(requests.size, 1);

    console.log("All cleanup tests passed!");
};

testCleanupExpiredRequests();
