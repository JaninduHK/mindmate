import mongoose from 'mongoose';
import Goal from '../models/Goal.js';

import dns from 'dns'; // ✅ DNS module එක import කරන්න

// ✅ DNS settings වෙනස් කරන්න
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); // Google DNS, Cloudflare DNS


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // 30s — Atlas free tier can be slow to wake
      socketTimeoutMS: 45000,
      family: 4 
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Cleanup stale index from older goal schema.
    // Old unique index on (userId, goalName) blocks reusing the same goal
    // name in future dates/weeks, which is no longer desired behavior.
    try {
      const indexes = await Goal.collection.indexes();
      const staleUnique = indexes.find((idx) => idx?.name === 'userId_1_goalName_1' && idx?.unique);
      if (staleUnique) {
        await Goal.collection.dropIndex('userId_1_goalName_1');
        console.log('🧹 Dropped stale Goal unique index: userId_1_goalName_1');
      }
    } catch (indexError) {
      console.warn('⚠️ Could not cleanup Goal indexes:', indexError?.message || indexError);
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
