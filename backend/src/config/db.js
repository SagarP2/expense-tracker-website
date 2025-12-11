const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MongoDB connection string (MONGO_URI) is not set in environment.');
    return;
  }
  try {
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(uri,{
      maxPoolSize: Number(process.env.DB_MAX_POOL) || 10,
      serverSelectionTimeoutMS: Number(process.env.DB_CONN_TIMEOUT) || 5000,
      socketTimeoutMS: Number(process.env.DB_IDLE_TIMEOUT) || 45000,
      family: 4
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (/Atlas cluster|whitelist/i.test(error.message)) {
      console.error('Action required: Add your current IP to the MongoDB Atlas project IP Access List and prefer SRV connection strings (mongodb+srv://).');
    }
    console.error('Server will continue running, but database-dependent routes will fail until connectivity is restored.');
  }
};

module.exports = connectDB;
