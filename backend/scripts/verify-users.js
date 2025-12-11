const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../src/models/User');

dotenv.config({ path: path.join(__dirname,'../.env') });

const verifyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const emails = ['usera@test.com','userb@test.com'];

        const users = await User.find({ email: { $in: emails } });
        console.log('Found users:',users.map(u => u.email));

        const result = await User.updateMany(
            { email: { $in: emails } },
            { $set: { emailVerified: true } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users to verified`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error verifying users:',error);
        process.exit(1);
    }
};

verifyUsers();
