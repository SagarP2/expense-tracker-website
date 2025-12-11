const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI,{
      maxPoolSize: process.env.DB_MAX_POOL || 10,
      serverSelectionTimeoutMS: process.env.DB_CONN_TIMEOUT || 5000,
      socketTimeoutMS: process.env.DB_IDLE_TIMEOUT || 45000,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
