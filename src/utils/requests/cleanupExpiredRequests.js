const cleanupExpiredRequests = (requests, currentTime = Date.now()) => {
    for (const [clientIp, record] of requests) {
        if (currentTime >= record.expiresAt) {
            requests.delete(clientIp);
        }
    }
};

module.exports = cleanupExpiredRequests;