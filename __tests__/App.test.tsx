/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

jest.mock(
  'expo-font',
  () => ({
    useFonts: () => [true],
  }),
  { virtual: true },
);

jest.mock(
  'expo-linear-gradient',
  () => ({
    LinearGradient: 'LinearGradient',
  }),
  { virtual: true },
);

jest.mock(
  'expo-image-picker',
  () => ({
    requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
  }),
  { virtual: true },
);

jest.mock(
  'expo-document-picker',
  () => ({
    getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
  }),
  { virtual: true },
);

jest.mock(
  'expo-file-system',
  () => ({
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  }),
  { virtual: true },
);

jest.mock(
  'expo-location',
  () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getCurrentPositionAsync: jest.fn().mockResolvedValue({
      coords: { latitude: 12.9716, longitude: 77.5946, altitude: 0, accuracy: 5 },
    }),
    watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
    reverseGeocodeAsync: jest.fn().mockResolvedValue([{ city: 'Bengaluru', region: 'Karnataka' }]),
    geocodeAsync: jest.fn().mockResolvedValue([{ latitude: 12.9716, longitude: 77.5946 }]),
    Accuracy: { High: 4, Balanced: 3 },
  }),
  { virtual: true },
);

jest.mock(
  'expo-notifications',
  () => ({
    setNotificationHandler: jest.fn(),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-id-123'),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  }),
  { virtual: true },
);

jest.mock(
  'react-native-maps',
  () => {
    const React = require('react');
    const { View } = require('react-native');
    const MockMapView = (props: any) => <View {...props}>{props.children}</View>;
    const MockMarker = (props: any) => <View {...props}>{props.children}</View>;
    return {
      __esModule: true,
      default: MockMapView,
      Marker: MockMarker,
      Polyline: (props: any) => <View {...props} />,
      Circle: (props: any) => <View {...props} />,
      Callout: (props: any) => <View {...props}>{props.children}</View>,
    };
  },
  { virtual: true },
);


jest.mock(
  'react-native-webview',
  () => {
    const React = require('react');
    const { View } = require('react-native');
    return {
      WebView: (props: any) => <View {...props} />,
    };
  },
  { virtual: true },
);

jest.mock('@react-native-firebase/app', () => ({
  getApp: () => ({ name: '[DEFAULT]' }),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: () => ({}),
  log: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: null,
  }),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
