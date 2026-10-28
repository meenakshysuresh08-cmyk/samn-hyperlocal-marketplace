require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const TaskBid = require('../models/TaskBid');
const Message = require('../models/Message');

async function removeDefaultTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Script] Connected to MongoDB...');

    // Titles of default seed tasks
    const defaultTitles = [
      'Urgent Pharmacy Pickup: Blood Pressure Medication',
      'Quick Home WiFi & Smart TV Setup Assistance',
      'Need 2 Heavy Moving Boxes Shifted to 3rd Floor',
    ];

    const defaultTasks = await Task.find({
      $or: [
        { title: { $in: defaultTitles } },
        { customerId: '6a956f2a44013c5385398ff6' },
      ],
    });

    console.log(`Found ${defaultTasks.length} default demo tasks to delete.`);
    const taskIds = defaultTasks.map((t) => t._id);

    if (taskIds.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIds } });
      await TaskBid.deleteMany({ taskId: { $in: taskIds } });
      await Message.deleteMany({ taskId: { $in: taskIds } });
      console.log('Successfully deleted default demo tasks:', defaultTasks.map((t) => t.title));
    }

    const remainingTasks = await Task.find({}).select('title category customerId');
    console.log('Remaining active tasks in database:', remainingTasks);

    process.exit(0);
  } catch (err) {
    console.error('Error removing default tasks:', err);
    process.exit(1);
  }
}

removeDefaultTasks();
