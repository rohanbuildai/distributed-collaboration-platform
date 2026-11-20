
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const pool = require("./config/database");

const mainRoute = require("./Routes/mainRoute/centralizedRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Collaboration platform is running"
    });
});

app.get("/api/v1/ready", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            success: true,
            status: "ready",
            checks: {
                database: "connected",
            },
        });
    } catch (error) {
        console.error("Readiness check failed:", error.message);

        return res.status(503).json({
            success: false,
            status: "not_ready",
            checks: {
                database: "disconnected",
            },
        });
    }
});

app.use("/api/v1", mainRoute);
app.use(errorMiddleware);

module.exports = app;
