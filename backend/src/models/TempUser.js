const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tempUserSchema = mongoose.Schema(
    {
        name: { type: String,required: true },
        email: { type: String,required: true,unique: true },
        username: { type: String,unique: true },
        password: { type: String,required: true },
        mobileNumber: { type: String,default: '' },
        verificationToken: { type: String,required: true },
        createdAt: { type: Date,default: Date.now,expires: 1800 } // TTL: 30 minutes (1800 seconds)
    },
    { timestamps: true }
);

// Hash password before saving (same as User model)
tempUserSchema.pre('save',async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
});

const TempUser = mongoose.model('TempUser',tempUserSchema);
module.exports = TempUser;
