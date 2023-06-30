import { CategoriesSettings } from './apps/CategoriesSettings.js';
import { CATEGORY_IDS, FOUNDRY_SETTING_IDS, MODULE, SETTING_IDS, SYSTEM_IDS } from './constants.js';

export function getDefaultCategories() {
  const baseCategories = [CATEGORY_IDS.TARGETED, CATEGORY_IDS.SELECTED, CATEGORY_IDS.ALL];

  switch (game.system.id) {
    case SYSTEM_IDS.COC:
      return [...baseCategories, 'type.character', 'type.creature', 'type.npc'];
    case SYSTEM_IDS.FL:
      return [...baseCategories, 'type.character', 'type.monster'];
    case SYSTEM_IDS.PF2E:
      return [...baseCategories, 'type.character', 'type.familiar', 'type.npc'];
    default:
      return [...baseCategories, 'type.character', 'type.npc'];
  }
}

export function computeSettings() {
  const baseSettings = FOUNDRY_SETTING_IDS.reduce(
    (accum, value) => ({
      ...accum,
      [value]: game.settings.get(MODULE.ID, value),
    }),
    {}
  );

  switch (game.system.id) {
    case SYSTEM_IDS.FL:
      return {
        ...baseSettings,
        [SETTING_IDS.FORM_SETTINGS]: {
          width: 500,
          height: 362,
        },
      };
    case SYSTEM_IDS.WFRP4E:
      return {
        ...baseSettings,
        [SETTING_IDS.FORM_SETTINGS]: {
          width: 500,
          height: 380,
        },
      };
    default:
      return {
        ...baseSettings,
        [SETTING_IDS.FORM_SETTINGS]: {
          width: 500,
          height: 352,
        },
      };
  }
}

export function updateSettings() {
  window[MODULE.NAMESPACE].settings = computeSettings();
}

export function registerSettings() {
  game.settings.registerMenu(MODULE.ID, SETTING_IDS.CATEGORIES + 'Menu', {
    name: 'Categories',
    label: 'Configure Categories',
    hint: 'Manage the available categories.',
    icon: 'fa fa-list-check',
    type: CategoriesSettings,
    restricted: true,
  });

  game.settings.register(MODULE.ID, SETTING_IDS.CATEGORIES, {
    scope: 'world',
    config: false,
    type: Array,
    default: getDefaultCategories(),
    onChange: updateSettings,
  });

  game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION, {
    name: 'Post chat message',
    hint: 'Wheter a chat message should be sent whenever a target is selected.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: updateSettings,
  });

  game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION_PUBLIC, {
    name: 'Show chat message to the players',
    hint: 'Wheter the chat message should be shown to the players.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    onChange: updateSettings,
  });

  return computeSettings();
}

export function saveSetting(key, value) {
  game.settings.set(MODULE.ID, key, value);
}
