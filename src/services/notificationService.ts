import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import API from './api';

// Safe configuration of foreground notification presentation
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  // Ignored in environments where setNotificationHandler is unsupported
}

type ToastCallback = (title: string, body: string, data?: any) => void;
const toastListeners: Set<ToastCallback> = new Set();

export const subscribeToNotificationToasts = (cb: ToastCallback) => {
  toastListeners.add(cb);
  return () => {
    toastListeners.delete(cb);
  };
};

export const triggerInAppToast = (title: string, body: string, data?: any) => {
  toastListeners.forEach((cb) => {
    try {
      cb(title, body, data);
    } catch (err) {}
  });
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    // 1. Request OS level permissions safely
    let finalStatus = 'undetermined';
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    } catch (permErr) {
      // Permission query fallback
    }

    // 2. Set Android Notification Channel
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'SAMN Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          sound: 'default',
        });
      } catch (channelErr) {}
    }

    // 3. Obtain token or dev fallback without throwing noisy projectId errors
    let token = `device-token-${Platform.OS}-${Date.now()}`;
    try {
      // Only call remote token if available in native builds
      const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
      if (tokenData && tokenData.data) {
        token = tokenData.data;
      }
    } catch (tokenErr) {
      // Handled silently for Expo Go development
    }

    // 4. Sync device token with backend profile
    if (token) {
      await API.put('/users/profile', { fcmToken: token }).catch(() => {});
    }

    return token;
  } catch (error) {
    return null;
  }
};

export const showLocalNotification = async (title: string, body: string, data: any = {}) => {
  try {
    // 1. Always display instant interactive in-app toast dropdown
    triggerInAppToast(title, body, data);

    // 2. Schedule OS local notification banner
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // deliver immediately
      });
    } catch (scheduleErr) {
      // Handled in Expo Go SDK 53/54 fallback
    }
  } catch (err) {
    // Silent failover to in-app toast
  }
};
