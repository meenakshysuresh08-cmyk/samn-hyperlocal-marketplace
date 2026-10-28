/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthNavigator } from '../screens/auth';
import { ChatScreen } from '../screens/chat/ChatScreen';
import DashboardScreen from '../screens/home/DashboardScreen';
import ExploreScreen from '../screens/tasks/ExploreScreen';
import PostTaskScreen from '../screens/tasks/PostTaskScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { UploadDetailsScreen } from '../screens/uploads/UploadDetailsScreen';
import { UploadsScreen } from '../screens/uploads/UploadsScreen';
import { AppBottomTabBar } from './AppBottomTabBar';
import { TAB_BAR_DEFAULT_INSET, TabBarInsetContext } from './tabBarLayout';
import { useAuthStore } from '../services/authStore';

const RootStack = createNativeStackNavigator<any>();
const Tabs = createBottomTabNavigator<any>();
const HomeStack = createNativeStackNavigator<any>();
const ExploreStack = createNativeStackNavigator<any>();
const ChatStack = createNativeStackNavigator<any>();
const ProfileStack = createNativeStackNavigator<any>();
const SettingsStack = createNativeStackNavigator<any>();

const HomeStackNavigator = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
    <HomeStack.Screen name="Explore" component={ExploreScreen} />
    <HomeStack.Screen name="TaskDetail" component={TaskDetailScreen} />
    <HomeStack.Screen name="PostTask" component={PostTaskScreen} />
    <HomeStack.Screen name="Chat" component={ChatScreen} />
    <HomeStack.Screen name="Uploads" component={UploadsScreen as any} />
    <HomeStack.Screen name="UploadDetails" component={UploadDetailsScreen as any} />
  </HomeStack.Navigator>
);

const ExploreStackNavigator = () => (
  <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
    <ExploreStack.Screen name="Explore" component={ExploreScreen} />
    <ExploreStack.Screen name="TaskDetail" component={TaskDetailScreen} />
    <ExploreStack.Screen name="PostTask" component={PostTaskScreen} />
    <ExploreStack.Screen name="Chat" component={ChatScreen} />
    <ExploreStack.Screen name="Uploads" component={UploadsScreen as any} />
    <ExploreStack.Screen name="UploadDetails" component={UploadDetailsScreen as any} />
  </ExploreStack.Navigator>
);

const ChatStackNavigator = () => (
  <ChatStack.Navigator screenOptions={{ headerShown: false }}>
    <ChatStack.Screen name="Chat" component={ChatScreen} />
    <ChatStack.Screen name="TaskDetail" component={TaskDetailScreen} />
  </ChatStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

const SettingsStackNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

const MainTabs = () => {
  const [tabBarInset, setTabBarInset] = useState(TAB_BAR_DEFAULT_INSET);

  return (
    <TabBarInsetContext.Provider value={tabBarInset}>
      <Tabs.Navigator
        initialRouteName="HomeStack"
        screenOptions={{ headerShown: false }}
        tabBar={props => <AppBottomTabBar {...props} onHeightChange={setTabBarInset} />}
      >
        <Tabs.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: 'Home' }} />
        <Tabs.Screen name="ExploreStack" component={ExploreStackNavigator} options={{ title: 'Radar' }} />
        <Tabs.Screen name="PostTask" component={PostTaskScreen} options={{ title: 'Post' }} />
        <Tabs.Screen name="ChatStack" component={ChatStackNavigator} options={{ title: 'Chat' }} />
        <Tabs.Screen name="ProfileStack" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
        <Tabs.Screen name="SettingsStack" component={SettingsStackNavigator} options={{ title: 'Settings' }} />
      </Tabs.Navigator>
    </TabBarInsetContext.Provider>
  );
};

export const RootNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabs} />
          <RootStack.Screen name="MainTabs" component={MainTabs} />
          <RootStack.Screen name="PostTask" component={PostTaskScreen} />
          <RootStack.Screen name="Explore" component={ExploreScreen} />
          <RootStack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <RootStack.Screen name="Chat" component={ChatScreen} />
          <RootStack.Screen name="Uploads" component={UploadsScreen as any} />
          <RootStack.Screen name="UploadDetails" component={UploadDetailsScreen as any} options={{ title: 'Upload Details' }} />
        </>
      )}
    </RootStack.Navigator>
  );
};
