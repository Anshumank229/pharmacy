// scripts/createAdmin.js
// Secure CLI script to create admin user
// Run with: node scripts/createAdmin.js

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/User.js";

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Admin credentials
    const adminEmail = "admin@medstore.com";
    const adminPassword = "Admin@123";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`Email: ${adminEmail}`);
      process.exit(0);
    }

    // Create admin user
    console.log("👤 Creating admin user...");
    const admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", admin.email);
    console.log("👤 Name:", admin.name);
    console.log("🔐 Role:", admin.role);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  IMPORTANT: Change the default password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log("🔌 Disconnected from MongoDB");
    }
  }
};

// Run the script
createAdmin();
