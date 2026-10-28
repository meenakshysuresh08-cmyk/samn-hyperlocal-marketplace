const { admin, firebaseApp } = require('../config/firebase');

const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
  if (!firebaseApp || !fcmToken) {
    return { success: false, reason: 'Firebase not configured or no FCM token' };
  }

  try {
    const stringifiedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      return acc;
    }, {});

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          color: '#6366F1',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.warn(`[FCM Error] Push notification failed for token ${fcmToken}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification };
