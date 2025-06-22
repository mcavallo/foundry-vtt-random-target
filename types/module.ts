import type { ChatManager } from '@/lib/ChatManager.ts';
import type { GameManager } from '@/lib/GameManager.ts';
import type { NotificationsManager } from '@/lib/NotificationsManager.ts';
import type { RandomManager } from '@/lib/RandomManager.ts';
import type { SettingsManager } from '@/lib/SettingsManager.ts';

export interface ModuleWindow {
  run: () => void;
  settings: SettingsManager;
  chat: ChatManager;
  game: GameManager;
  notifications: NotificationsManager;
  random: RandomManager;
}

export interface Category {
  id: string;
  type: string;
  label: string;
  description: string;
  info?: string;
  tabId: string;
  enabled: boolean;
  items: string[];
  totalItems: number;
}

export interface RandomTargetChatMessage extends ChatMessage {
  flags: ChatMessage['flags'] & {
    randomTarget?: {
      type?: string;
    };
  };
}

// TODO: Add the remaining fields
export interface TargetAppRenderingContext {
  totalSceneTokens: number;
}
