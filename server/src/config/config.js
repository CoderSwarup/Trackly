import dotenv from "dotenv"

const config = Object.freeze({
    NODE_ENV: process.env.NODE_ENV || "development",
    REDIS_URL: process.env.REDIS_URL || "",
    PORT: parseInt(process.env.PORT) || 5000,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    SERVER_URL: process.env.SERVER_URL || `http://localhost:5000/api/v1`

})

export default config