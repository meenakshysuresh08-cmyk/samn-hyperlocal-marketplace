const cron = require('node-cron');
const mongoose = require('mongoose');
const { checkAndExecuteFallbackBroadcast } = require('../services/fallback.service');

const initFallbackBroadcastJob = () => {
  // Run every 2 minutes to check for tasks pending >= 15 min
  cron.schedule('*/2 * * * *', async () => {
    try {
      // Only execute when database connection is fully active
      if (mongoose.connection.readyState === 1) {
        await checkAndExecuteFallbackBroadcast();
      }
    } catch (err) {
      console.error('[Fallback Cron Error]:', err.message);
    }
  });

  console.log('[Cron Job] Fallback Broadcast scheduled (every 2 minutes)');
};

module.exports = { initFallbackBroadcastJob };
