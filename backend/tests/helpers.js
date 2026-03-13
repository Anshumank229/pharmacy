// backend/tests/helpers.js
// Shared test helper functions used across all test suites

import User from "../src/models/User.js";
import Medicine from "../src/models/Medicine.js";
import Order from "../src/models/Order.js";
import Coupon from "../src/models/Coupon.js";
import jwt from "jsonwebtoken";
import cookie from "cookie";

// ─── Default test data constants ──────────────────────────────────────────────
export const DEFAULT_PASSWORD = "Password123!";
export const ADMIN_EMAIL = "admin@medstore.com";
export const USER_EMAIL = "user@medstore.com";

// ─── User helpers ─────────────────────────────────────────────────────────────

/**
 * Create a user directly in the DB (no HTTP round-trip).
 * @param {object} overrides
 * @returns {mongoose.Document} saved user
 */
export const createTestUser = async (overrides = {}) => {
    const defaults = {
        name: "Test User",
        email: USER_EMAIL,
        password: DEFAULT_PASSWORD,
        role: "user",
        isActive: true
    };
    return User.create({ ...defaults, ...overrides });
};

/**
 * Create an admin user directly in DB.
 */
export const createTestAdmin = async (overrides = {}) => {
    return createTestUser({
        name: "Admin User",
        email: ADMIN_EMAIL,
        role: "admin",
        ...overrides
    });
};

/**
 * Generate a valid signed JWT for a user (bypasses HTTP login in unit tests).
 * @returns { accessToken, cookieHeader }
 */
export const generateAuthToken = (userId, role = "user") => {
    const accessToken = jwt.sign(
        { id: userId, role },
        process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || "test_secret",
        { expiresIn: "15m" }
    );
    const cookieHeader = `accessToken=${accessToken}`;
    return { accessToken, cookieHeader };
};

/**
 * Perform HTTP login via supertest agent and return the Set-Cookie header.
 * @param {import("supertest").SuperTest} agent
 * @param {object} credentials
 * @returns {string} Cookie header string
 */
export const loginAndGetCookies = async (agent, credentials) => {
    const res = await agent
        .post("/api/auth/login")
        .send(credentials);

    // Return the raw Set-Cookie header(s)
    return res.headers["set-cookie"] || [];
};

// ─── Medicine helpers ──────────────────────────────────────────────────────────

/**
 * Create a test medicine.
 */
export const createTestMedicine = async (overrides = {}) => {
    const defaults = {
        name: "Test Medicine",
        brand: "TestBrand",
        price: 100,
        stock: 50,
        category: "Antibiotics",
        requiresPrescription: false
    };
    return Medicine.create({ ...defaults, ...overrides });
};

// ─── Order helpers ─────────────────────────────────────────────────────────────

/**
 * Build a valid order payload for use with POST /api/orders.
 */
export const buildOrderPayload = (medicines, overrides = {}) => {
    const shippingAddress = {
        name: "Test User",
        email: "test@example.com",
        phone: "9876543210",
        address: "123 Test Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India"
    };

    return {
        shippingAddress,
        paymentMethod: "cod",
        items: medicines.map(m => ({ medicine: m._id, quantity: 1, price: m.price })),
        ...overrides
    };
};

/**
 * Create an order directly in the DB (bypasses request flow).
 */
export const createTestOrder = async (userId, medicineId, price = 100, overrides = {}) => {
    return Order.create({
        user: userId,
        items: [{ medicine: medicineId, quantity: 1, price }],
        totalAmount: price,
        subtotal: price,
        shippingAddress: {
            name: "Test User",
            email: "test@example.com",
            phone: "9876543210",
            address: "123 Test Street",
            city: "Mumbai",
            postalCode: "400001"
        },
        paymentMethod: "cod",
        paymentStatus: "pending",
        orderStatus: "processing",
        ...overrides
    });
};

// ─── Coupon helpers ────────────────────────────────────────────────────────────

/**
 * Create a test coupon.
 */
export const createTestCoupon = async (overrides = {}) => {
    const defaults = {
        code: "TEST10",
        discountPercent: 10,
        minOrderAmount: 0,
        isActive: true,
        usageLimit: null,
        usedCount: 0,
        perUserLimit: 1
    };
    return Coupon.create({ ...defaults, ...overrides });
};

// ─── Cart helper ──────────────────────────────────────────────────────────────
import Cart from "../src/models/Cart.js";

export const seedCart = async (userId, medicines) => {
    await Cart.findOneAndDelete({ user: userId });
    return Cart.create({
        user: userId,
        items: medicines.map(m => ({ medicine: m._id, quantity: 2 }))
    });
};
