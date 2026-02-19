// ecosystem.config.cjs
// PM2 cluster configuration for production deployment.
// Usage: pm2 start ecosystem.config.cjs
// Docs:  https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
    apps: [
        {
            name: "medstore-backend",
            script: "src/server.js",

            // ── Cluster mode: one worker per CPU core ──────────────────────────────
            instances: "max",
            exec_mode: "cluster",

            // ── Environment ────────────────────────────────────────────────────────
            env: {
                NODE_ENV: "development",
                PORT: 5000,
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 5000,
            },

            // ── Restart policy ─────────────────────────────────────────────────────
            watch: false,                    // Don't watch files in production
            max_memory_restart: "512M",      // Restart if memory exceeds 512MB
            restart_delay: 3000,             // Wait 3s between restarts
            max_restarts: 10,                // Give up after 10 consecutive crashes

            // ── Logging ────────────────────────────────────────────────────────────
            log_date_format: "YYYY-MM-DD HH:mm:ss Z",
            error_file: "logs/pm2-error.log",
            out_file: "logs/pm2-out.log",
            merge_logs: true,

            // ── Node.js flags ──────────────────────────────────────────────────────
            node_args: "--max-old-space-size=512",

            // ── Graceful shutdown ──────────────────────────────────────────────────
            kill_timeout: 5000,              // 5s to finish in-flight requests
            listen_timeout: 10000,           // 10s to start listening
        },
    ],
};
