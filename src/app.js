const express = require("express");

const mainRoute = require("../Routes/auth/auth") ;

const app = express();

app.use(express.json());

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Collaboration platform is running"
    });
});

app.use("/api/v1" , mainRoute ) ;

module.exports = app;