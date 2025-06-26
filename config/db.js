// config/db.js
import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'CHARTS',
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      maxPoolSize: 10 // Maximum number of connections
    });
    console.log('✅ MongoDB Connected via Mongoose');
  } catch (err) {
    console.error('❌ Connection Error:', err);
    process.exit(1);
  }
};

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

export default connectDB;