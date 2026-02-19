// Quick script to check admin user
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

dotenv.config();

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const admin = await User.findOne({ email: 'admin@medstore.com' });

        if (!admin) {
            console.log('❌ Admin user NOT found!');
            console.log('📝 Run: npm run create-admin\n');
        } else {
            console.log('✅ Admin user found:');
            console.log('   Email:', admin.email);
            console.log('   Name:', admin.name);
            console.log('   Role:', admin.role);
            console.log('   ID:', admin._id);

            // Test password
            const testPassword = 'Admin@123';
            const isMatch = await admin.matchPassword(testPassword);
            console.log('\n🔐 Password test (Admin@123):', isMatch ? '✅ CORRECT' : '❌ WRONG');

            if (!isMatch) {
                console.log('\n⚠️  Password does NOT match!');
                console.log('💡 Solution: Delete and recreate admin user');
                console.log('   Command: db.users.deleteOne({email: "admin@medstore.com"})');
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
};

checkAdmin();
