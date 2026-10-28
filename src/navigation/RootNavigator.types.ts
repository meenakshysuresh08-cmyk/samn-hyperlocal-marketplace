export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  UploadDetails: {
    uploadId: string;
  };
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  OtpVerification: { email: string };
  ResetPassword: { email: string };
  PasswordResetSuccess: undefined;
};

export type MainTabParamList = {
  CreateStack: undefined;
  ChatStack: undefined;
  HomeStack: undefined;
  ProfileStack: undefined;
  SettingsStack: undefined;
};

export type HomeStackParamList = {
  Dashboard: undefined;
};

export type CreateStackParamList = {
  Uploads: undefined;
};

export type ChatStackParamList = {
  Chat: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type UploadsStackParamList = CreateStackParamList;

export type SettingsStackParamList = {
  Settings: undefined;
};
