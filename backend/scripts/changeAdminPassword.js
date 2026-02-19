// Change admin password
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const changeAdminPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find admin user
        const admin = await User.findOne({ email: 'admin@medstore.com' });

        if (!admin) {
            console.log('❌ Admin user not found!');
            console.log('Please run: npm run create-admin\n');
            process.exit(1);
        }

        // Set new password
        admin.password = 'anshuman2002';
        await admin.save();

        console.log('✅ Admin password changed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@medstore.com');
        console.log('🔐 New Password: anshuman2002');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
};

changeAdminPassword();
