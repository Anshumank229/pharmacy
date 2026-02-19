// src/config/validateEnv.js
// Validates environment variables at startup.
// Hard-crashes on missing required vars.
// Warns (never crashes) on missing optional vars.

const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET", "PORT"];

const OPTIONAL_VARS_WITH_DEFAULTS = {
    NODE_ENV: "development",
    CLIENT_URL: "http://localhost:5173",
};

// Known insecure placeholder values for JWT_SECRET
const INSECURE_JWT_SECRETS = [
    "supersecretjwtkeychangeit",
    "your-super-secret-jwt-key-change-this-in-production",
    "secret",
    "changeme",
    "jwt_secret",
];

export const validateEnv = () => {
    // ── 1. Hard-fail on missing required vars ──────────────────────────────────
    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error("❌ Missing required environment variables:");
        missing.forEach((key) => console.error(`   - ${key}`));
        console.error("\nPlease copy .env.example to .env and fill in the values.");
        process.exit(1);
    }

    // ── 2. DANGER: Insecure JWT_SECRET ────────────────────────────────────────
    const jwtSecret = process.env.JWT_SECRET || "";
    const isInsecureJwt =
        INSECURE_JWT_SECRETS.includes(jwtSecret.toLowerCase()) ||
        jwtSecret.length < 32;

    if (isInsecureJwt) {
        console.error("╔══════════════════════════════════════════════════════════╗");
        console.error("║  DANGER: JWT_SECRET is using an insecure placeholder!    ║");
        console.error("║  All user sessions can be forged with this secret.       ║");
        console.error("║  Generate a strong secret before ANY deployment:         ║");
        console.error("║  node -e \"console.log(require('crypto')                  ║");
        console.error("║           .randomBytes(64).toString('hex'))\"              ║");
        console.error("╚══════════════════════════════════════════════════════════╝");
        // In production, refuse to start
        if (process.env.NODE_ENV === "production") {
            console.error("❌ Refusing to start in production with an insecure JWT_SECRET.");
            process.exit(1);
        }
    }

    // ── 3. Warn about optional vars using defaults ────────────────────────────
    Object.entries(OPTIONAL_VARS_WITH_DEFAULTS).forEach(([key, defaultVal]) => {
        if (!process.env[key]) {
            console.warn(`⚠️  ${key} not set — using default: "${defaultVal}"`);
        }
    });

    // ── 4. Warn if Cloudinary is not configured ───────────────────────────────
    const cloudinaryVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
    const missingCloudinary = cloudinaryVars.filter((k) => !process.env[k]);
    if (missingCloudinary.length > 0) {
        console.warn("⚠️  Cloudinary not configured — image uploads will use local disk storage.");
        console.warn("   Get credentials at: https://cloudinary.com/console");
    }

    // ── 5. Warn if email is not configured ────────────────────────────────────
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn("⚠️  Email service not configured — transactional emails will be skipped.");
        console.warn("   Set EMAIL_USER and EMAIL_PASSWORD in .env to enable emails.");
    }

    console.log("✅ Environment variables validated");
};
