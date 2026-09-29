const requests = new Map();

const rateLimit = (options = {}) => {
    const {
        windowMs = 60 * 1000,
        maxRequests = 10
    } = options;

    return (req, res, next) => {
        const clientIp = req.ip;
        const currentTime = Date.now();

        const record = requests.get(clientIp);

        // First request from this IP
        if (!record) {
            requests.set(clientIp, {
                count: 1,
                windowStart: currentTime
            });

            return next();
        }

        const windowExpired =
            currentTime - record.windowStart >= windowMs;

        // Existing window has expired
        if (windowExpired) {
            requests.set(clientIp, {
                count: 1,
                windowStart: currentTime
            });

            return next();
        }

        // Request limit reached
        if (record.count >= maxRequests) {
        const retryAfter = Math.ceil(
            (windowMs - (currentTime - record.windowStart)) / 1000
        );

        res.set("Retry-After", retryAfter);

        return res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later."
        });
    }

        // Request is within the allowed limit
        record.count += 1;

        next();
    };
};

module.exports = rateLimit;