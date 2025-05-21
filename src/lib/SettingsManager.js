import { CategoriesSettings } from '../apps/CategoriesSettings.js';
import {
  BASE_CATEGORIES,
  FOUNDRY_SETTING_IDS,
  MODULE,
  PREFERRED_IMAGE,
  PREFERRED_IMAGE_OPTIONS,
  SETTING_IDS,
  SYSTEM_IDS,
} from '../constants.js';

export class SettingsManager {
  constructor() {
    this._registerSettings();
    this._updateSettings();
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    game.settings.set(MODULE.ID, key, value);
  }

  _registerSettings() {
    game.settings.registerMenu(MODULE.ID, SETTING_IDS.CATEGORIES + 'Menu', {
      name: 'Categories',
      label: 'Configure Categories',
      hint: 'Manage the available target categories.',
      icon: 'fa fa-list-check',
      type: CategoriesSettings,
      restricted: true,
    });

    game.settings.register(MODULE.ID, SETTING_IDS.CATEGORIES, {
      scope: 'world',
      config: false,
      type: Array,
      default: this._getDefaultCategories(),
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION, {
      name: 'Post chat message',
      hint: 'Whether a chat message should be sent when a random target is selected.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION_PUBLIC, {
      name: 'Show chat message to the players',
      hint: 'Whether the chat message should be shown to the players.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.PERSIST_SELECTION, {
      name: 'Persist selection',
      hint: 'Whether the pre-selected targets should persist and be automatically selected in subsequent runs.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.AVOID_SELECTING_SAME_TARGET, {
      name: 'Avoid selecting the same target',
      hint: 'Whether to prevent the same target from being targeted twice in a row.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.PREFERRED_IMAGE, {
      name: 'Preferred target image',
      hint: 'Specify the preferred image to be displayed in the list of targets.',
      scope: 'world',
      config: true,
      type: String,
      choices: PREFERRED_IMAGE_OPTIONS,
      default: PREFERRED_IMAGE.TOKEN,
      onChange: this._updateSettings.bind(this),
      requiresReload: false,
    });

    game.settings.register(MODULE.ID, SETTING_IDS.PREV_TARGET_ID, {
      scope: 'world',
      config: false,
      type: String,
      default: '',
      onChange: this._updateSettings.bind(this),
    });

    game.settings.register(MODULE.ID, SETTING_IDS.PREV_SELECTION, {
      scope: 'world',
      config: false,
      type: Array,
      default: [],
      onChange: this._updateSettings.bind(this),
    });
  }

  _getDefaultCategories() {
    switch (game.system.id) {
      case SYSTEM_IDS.COC:
        return [...BASE_CATEGORIES, 'type.character', 'type.creature', 'type.npc'];
      case SYSTEM_IDS.FL:
        return [...BASE_CATEGORIES, 'type.character', 'type.monster'];
      case SYSTEM_IDS.PF2E:
        return [...BASE_CATEGORIES, 'type.character', 'type.familiar', 'type.npc'];
      default:
        return [...BASE_CATEGORIES, 'type.character', 'type.npc'];
    }
  }

  _updateSettings() {
    this.settings = this._computeSettings();
  }

  _computeSettings() {
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
}
