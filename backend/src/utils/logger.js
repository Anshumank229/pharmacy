// src/utils/logger.js
// Centralised Winston logger — use this instead of console.log/error everywhere.
// In production: JSON format to stdout + error.log + combined.log files.
// In development: colourised, human-readable output.

import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

// ── Development format: pretty, colourised ─────────────────────────────────
const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: "HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${timestamp} [${level}] ${message}${stack ? `\n${stack}` : ""}${extras}`;
    })
);

// ── Production format: structured JSON ────────────────────────────────────
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
    level: isProduction ? "info" : "debug",
    format: isProduction ? prodFormat : devFormat,
    transports: [
        // Always log to console
        new winston.transports.Console(),

        // Error-only file — survives log rotation tools
        new winston.transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
            format: combine(timestamp(), errors({ stack: true }), json()),
            maxsize: 10 * 1024 * 1024, // 10 MB
            maxFiles: 5,
        }),

        // All-levels file
        new winston.transports.File({
            filename: path.join(logsDir, "combined.log"),
            format: combine(timestamp(), errors({ stack: true }), json()),
            maxsize: 10 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],
    // Do NOT throw on unhandled rejections — we handle those in server.js
    exitOnError: false,
});

export default logger;
