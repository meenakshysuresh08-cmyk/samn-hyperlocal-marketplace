require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Task = require('./models/Task');
const TaskBid = require('./models/TaskBid');
const Rating = require('./models/Rating');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/samn');
    console.log('[Seed] Connected to MongoDB...');

    // Clear existing collections
    await User.deleteMany({});
    await Task.deleteMany({});
    await TaskBid.deleteMany({});
    await Rating.deleteMany({});
    console.log('[Seed] Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 1. Create Demo Customer (Alex)
    const customer = await User.create({
      name: 'Alex Morgan',
      email: 'customer@example.com',
      phone: '9876543210',
      passwordHash,
      activeRole: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bengaluru center
        address: 'MG Road, Bengaluru',
      },
      stats: {
        tasksPosted: 4,
        tasksCompleted: 0,
        totalSpent: 1200,
        totalEarned: 0,
        avgRatingAsCustomer: 4.9,
        ratingCountCustomer: 8,
      },
      isVerified: true,
      isOnline: true,
    });

    // 2. Create Demo Helper (Ravi)
    const helper1 = await User.create({
      name: 'Ravi Kumar',
      email: 'helper@example.com',
      phone: '9876543211',
      passwordHash,
      activeRole: 'helper',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      location: {
        type: 'Point',
        coordinates: [77.6012, 12.9784], // 1.1 km away
        address: 'Indiranagar, Bengaluru',
      },
      stats: {
        tasksPosted: 1,
        tasksCompleted: 24,
        totalEarned: 8600,
        totalSpent: 200,
        avgRatingAsHelper: 4.95,
        ratingCountHelper: 22,
      },
      isVerified: true,
      isOnline: true,
    });

    // 3. Create Demo Helper (Priya)
    const helper2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      phone: '9876543212',
      passwordHash,
      activeRole: 'helper',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      location: {
        type: 'Point',
        coordinates: [77.5891, 12.9654], // 1.4 km away
        address: 'Koramangala, Bengaluru',
      },
      stats: {
        tasksPosted: 0,
        tasksCompleted: 18,
        totalEarned: 6400,
        totalSpent: 0,
        avgRatingAsHelper: 4.88,
        ratingCountHelper: 16,
      },
      isVerified: true,
      isOnline: true,
    });

    console.log('[Seed] Users created successfully (No default tasks posted).');
    console.log('----------------------------------------------------');
    console.log('Customer: customer@example.com / password123');
    console.log('Helper 1: helper@example.com   / password123');
    console.log('Helper 2: priya@example.com    / password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();
