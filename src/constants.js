export const MODULE = {
  NAME: 'Random Target',
  ID: 'random-target',
  NAMESPACE: 'randomTarget',
  MACRO_COMPENDIUM: 'random-target-macros',
  MACRO_ID: 'oIVhNA8Po9HpYdJc',
};

export const SETTING_IDS = {
  AVOID_SELECTING_SAME_TARGET: 'avoidSelectingSameTarget',
  CATEGORIES: 'categories',
  CHAT_NOTIFICATION_PUBLIC: 'chatNotificationPublic',
  CHAT_NOTIFICATION: 'chatNotification',
  FORM_SETTINGS: 'formSettings',
  PERSIST_SELECTION: 'persistSelection',
  PREV_SELECTION: 'previousSelection',
  PREV_TARGET_ID: 'previousTargetId',
};

export const FOUNDRY_SETTING_IDS = [
  SETTING_IDS.AVOID_SELECTING_SAME_TARGET,
  SETTING_IDS.CATEGORIES,
  SETTING_IDS.CHAT_NOTIFICATION_PUBLIC,
  SETTING_IDS.CHAT_NOTIFICATION,
  SETTING_IDS.PERSIST_SELECTION,
  SETTING_IDS.PREV_SELECTION,
  SETTING_IDS.PREV_TARGET_ID,
];

export const SYSTEM_IDS = {
  COC: 'CoC7',
  CONAN: 'conan2d20',
  DND5E: 'dnd5e',
  FL: 'forbidden-lands',
  PF2E: 'pf2e',
  WFRP4E: 'wfrp4e',
};

export const CATEGORY_IDS = {
  ALL: 'core.all',
  PREVIOUS: 'core.previous',
  SELECTED: 'core.selected',
  TARGETED: 'core.targeted',
};

export const BASE_CATEGORIES = [CATEGORY_IDS.TARGETED, CATEGORY_IDS.SELECTED, CATEGORY_IDS.PREVIOUS, CATEGORY_IDS.ALL];
