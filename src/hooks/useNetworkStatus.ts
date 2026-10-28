import { useNetInfo } from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
  const netInfo = useNetInfo();

  return {
    isConnected: Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false),
    type: netInfo.type,
    details: netInfo.details,
  };
};
