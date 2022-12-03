import { MODULE, SYSTEM_IDS, FOUNDRY_SETTING_IDS, SETTING_IDS } from './constants.js';

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
  game[MODULE.NAMESPACE].settings = computeSettings();
}

export function registerSettings() {
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
