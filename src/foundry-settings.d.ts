import type { CHAT_NOTIFICATIONS, PREFERRED_IMAGE } from '@/constants';

type ChatNotificationsValue =
  (typeof CHAT_NOTIFICATIONS)[keyof typeof CHAT_NOTIFICATIONS];
type PreferredImageValue = (typeof PREFERRED_IMAGE)[keyof typeof PREFERRED_IMAGE];

declare module 'fvtt-types/configuration' {
  interface FlagConfig {
    ChatMessage: {
      randomTarget?: {
        type?: string;
      };
    };
  }

  interface SettingConfig {
    'random-target.avoidSelectingSameTarget': boolean;
    'random-target.categories': string[];
    'random-target.chatNotifications': ChatNotificationsValue;
    'random-target.closeAfter': boolean;
    'random-target.panToTarget': boolean;
    'random-target.imagePriority': PreferredImageValue;
    'random-target.previousSelection': string[];
    'random-target.previousTargetId': string;
    'random-target.previousWindowPosition': { left?: number; top?: number };
  }
}
