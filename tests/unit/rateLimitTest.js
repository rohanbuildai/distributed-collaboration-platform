
const cleanupExpiredRequests = require("../../src/utils/requests/cleanupExpiredRequests");
const rateLimit = require("../../src/middleware/rateLimitMiddleware");

describe("cleanupExpiredRequests", () => {
    test("removes expired entries and preserves future entries", () => {
        const requests = new Map([
            ["192.168.1.1", { count: 3, expiresAt: 1000 }],
            ["192.168.1.2", { count: 2, expiresAt: 2000 }],
            ["192.168.1.3", { count: 1, expiresAt: 3000 }]
        ]);

        cleanupExpiredRequests(requests, 2000);

        expect(requests.has("192.168.1.1")).toBe(false);
        expect(requests.has("192.168.1.2")).toBe(false);
        expect(requests.has("192.168.1.3")).toBe(true);
        expect(requests.size).toBe(1);
    });
});

describe("rateLimit middleware", () => {
    test("blocks requests above the limit with 429 and Retry-After", () => {
        const middleware = rateLimit({
            windowMs: 60_000,
            maxRequests: 2,
            cleanupIntervalMs: 60_000
        });

        const createMockResponse = () => ({
            headers: {},
            statusCode: null,
            body: null,
            set(name, value) {
                this.headers[name] = value;
                return this;
            },
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(body) {
                this.body = body;
                return this;
            }
        });

        const req = { ip: "192.0.2.10" };
        const next = jest.fn();

        middleware(req, createMockResponse(), next);
        middleware(req, createMockResponse(), next);

        const response = createMockResponse();
        middleware(req, response, next);

        expect(next).toHaveBeenCalledTimes(2);
        expect(response.statusCode).toBe(429);
        expect(response.headers["Retry-After"]).toBeGreaterThan(0);
        expect(response.body.success).toBe(false);
    });
});
