import type defaultTranslationsFile from '@/lang/en.json';
import type { ChatManager } from '@/lib/ChatManager.ts';
import type { GameManager } from '@/lib/GameManager.ts';
import type { NotificationsManager } from '@/lib/NotificationsManager.ts';
import type { RandomManager } from '@/lib/RandomManager.ts';
import type { SettingsManager } from '@/lib/SettingsManager.ts';
// @ts-expect-error this import has issues but the types are working fine
import type ApplicationV2 from 'fvtt-types/src/foundry/client/applications/api/application';

type LeafPath<T, Prev extends string = ''> = {
  [K in keyof T & string]: T[K] extends Record<string, any>
    ? LeafPath<T[K], `${Prev}${K}.`>
    : `${Prev}${K}`;
}[keyof T & string];

export type TranslationsFile = typeof defaultTranslationsFile;
export type Translations = (typeof defaultTranslationsFile)['random-target'];
export type TranslationKeys = LeafPath<Translations>;

export interface ModuleWindow {
  run: () => void;
  settings: SettingsManager;
  chat: ChatManager;
  game: GameManager;
  notifications: NotificationsManager;
  random: RandomManager;
}

export interface CategoryItemImage {
  src: string;
  animated: boolean;
}

export interface Category {
  id: string;
  type: string;
  label: string;
  description: string;
  info?: string;
  tabId: string;
  enabled: boolean;
  items: CategoryItem[];
  totalItems: number;
}

export interface CategoryItem {
  id: string;
  image: CategoryItemImage;
  name: string;
  actorId: string | null;
  type?: string;
  selected: boolean;
  defeated: boolean;
  hidden: boolean;
}

export interface RandomTargetChatMessage extends ChatMessage {
  flags: ChatMessage['flags'] & {
    randomTarget?: {
      type?: string;
    };
  };
}

export interface TargetAppRenderingContext {
  activeTabId: string | null;
  buttons?: ApplicationV2.FormFooterButton[];
  categories?: Category[];
  chatVisibility?: string;
  tabGroupName: string;
  tabs?: Record<string, ApplicationV2.Tab>;
  totalSceneTokens: number;
  totalTokens: number;
  translations?: object;
}
