// Reset admin user - delete old and create new
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete existing admin
        const deleted = await User.deleteOne({ email: 'admin@medstore.com' });
        console.log('🗑️  Deleted old admin user:', deleted.deletedCount, 'document(s)\n');

        // Create new admin with correct role
        const admin = await User.create({
            name: 'Admin',
            email: 'admin@medstore.com',
            password: 'Admin@123',
            role: 'admin'  // IMPORTANT: Set role to admin!
        });

        console.log('✅ New admin user created!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', admin.email);
        console.log('🔐 Password: Admin@123');
        console.log('👤 Name:', admin.name);
        console.log('🔑 Role:', admin.role);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ You can now login at /admin-login\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
};

resetAdmin();
