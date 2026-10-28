import type { VectorIconDefinition } from '../AppIcon/types';

type VectorIconName = VectorIconDefinition['name'];
type FeatherName = VectorIconName;
type IonName = VectorIconName;
type MaterialName = VectorIconName;
type MaterialCommunityName = VectorIconName;

const vector = (
  pack: VectorIconDefinition['pack'],
  name: string,
): VectorIconDefinition => ({
  type: 'vector',
  pack,
  name,
});

export const IconRegistry = {
  add: vector('feather', 'plus'),
  arrowLeft: vector('feather', 'arrow-left'),
  arrowRight: vector('feather', 'arrow-right'),
  bell: vector('feather', 'bell'),
  camera: vector('feather', 'camera'),
  check: vector('feather', 'check'),
  chevronDown: vector('feather', 'chevron-down'),
  chevronLeft: vector('feather', 'chevron-left'),
  chevronRight: vector('feather', 'chevron-right'),
  chevronUp: vector('feather', 'chevron-up'),
  clock: vector('feather', 'clock'),
  download: vector('feather', 'download'),
  edit: vector('feather', 'edit-2'),
  eye: vector('feather', 'eye'),
  eyeOff: vector('feather', 'eye-off'),
  file: vector('feather', 'file'),
  filter: vector('feather', 'filter'),
  help: vector('feather', 'help-circle'),
  home: vector('feather', 'home'),
  image: vector('feather', 'image'),
  info: vector('feather', 'info'),
  lock: vector('feather', 'lock'),
  logOut: vector('feather', 'log-out'),
  mail: vector('feather', 'mail'),
  mapPin: vector('feather', 'map-pin'),
  menu: vector('feather', 'menu'),
  moon: vector('feather', 'moon'),
  plus: vector('feather', 'plus'),
  search: vector('feather', 'search'),
  settings: vector('feather', 'settings'),
  sun: vector('feather', 'sun'),
  tag: vector('feather', 'tag'),
  trash: vector('feather', 'trash-2'),
  upload: vector('feather', 'upload-cloud'),
  user: vector('feather', 'user'),
  users: vector('feather', 'users'),
  wifiOff: vector('feather', 'wifi-off'),
  x: vector('feather', 'x'),

  tabHomeActive: vector('ion', 'home'),
  tabHomeInactive: vector('ion', 'home-outline'),
  tabCreateActive: vector('ion', 'add-circle'),
  tabCreateInactive: vector('ion', 'add-circle-outline'),
  tabChatActive: vector('ion', 'chatbubble'),
  tabChatInactive: vector('ion', 'chatbubble-outline'),
  tabProfileActive: vector('ion', 'person'),
  tabProfileInactive: vector('ion', 'person-outline'),
  tabSettingsActive: vector('ion', 'settings'),
  tabSettingsInactive: vector('ion', 'settings-outline'),
  tabQrCode: vector('materialCommunity', 'qrcode-scan'),

  close: vector('ion', 'close'),
  checkmark: vector('ion', 'checkmark'),
  alert: vector('ion', 'alert-circle-outline'),
} as const;

export type IconName = keyof typeof IconRegistry;
