import dotenv from "dotenv"

const config = Object.freeze({
    NODE_ENV: process.env.NODE_ENV || "development",
    REDIS_URL: process.env.REDIS_URL || "",
    PORT: parseInt(process.env.PORT) || 5000,
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    SERVER_URL: process.env.SERVER_URL || `http://localhost:5000/api/v1`,
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

})

export default config