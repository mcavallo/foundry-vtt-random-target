import { CategoriesSettings } from '@/apps/CategoriesSettings.js';
import {
  BASE_CATEGORIES,
  FOUNDRY_SETTING_IDS,
  MODULE,
  PREFERRED_IMAGE,
  PREFERRED_IMAGE_OPTIONS,
  SETTING_IDS,
  SYSTEM_IDS,
} from '../constants.js';
import { stripSettingNamespace } from './utils.js';

export class SettingsManager {
  constructor() {
    this._registerSettings();
    this._updateSettings();
  }

  get(key: string) {
    // @ts-expect-error fix types
    return this.settings[key];
  }

  set(key: string, value: unknown) {
    // @ts-expect-error fix types
    game.settings!.set(MODULE.ID, key, value);
  }

  isModuleSetting(key: string) {
    return key.startsWith(MODULE.ID);
  }

  shouldTriggerReRender(key: string) {
    if (!this.isModuleSetting(key)) {
      return false;
    }

    const name = stripSettingNamespace(key);
    return [SETTING_IDS.CATEGORIES, SETTING_IDS.PREFERRED_IMAGE].includes(name);
  }

  _registerSettings() {
    // @ts-expect-error fix types
    game.settings.registerMenu(MODULE.ID, SETTING_IDS.CATEGORIES + 'Menu', {
      name: 'Categories',
      label: 'Configure Categories',
      hint: 'Manage the available target categories.',
      icon: 'fa fa-list-check',
      // @ts-expect-error fix types
      type: CategoriesSettings,
      restricted: true,
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.CATEGORIES, {
      scope: 'world',
      config: false,
      type: Array,
      default: this._getDefaultCategories(),
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.CLOSE_AFTER, {
      name: 'Close after selection',
      hint: 'Whether the target selection window should close after a target is selected.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION, {
      name: 'Post chat message',
      hint: 'Whether a chat message should be sent when a random target is selected.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATION_PUBLIC, {
      name: 'Show chat message to the players',
      hint: 'Whether the chat message should be shown to the players.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.AVOID_SELECTING_SAME_TARGET, {
      name: 'Avoid selecting the same target',
      hint: 'Whether to prevent the same target from being targeted twice in a row.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
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

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.PREV_TARGET_ID, {
      scope: 'world',
      config: false,
      type: String,
      default: '',
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.PREV_SELECTION, {
      scope: 'world',
      config: false,
      type: Array,
      default: [],
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.PREV_WINDOW_POSITION, {
      scope: 'world',
      config: false,
      type: Object,
      default: {},
      onChange: this._updateSettings.bind(this),
    });
  }

  _getDefaultCategories() {
    switch (game.system!.id) {
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
    // @ts-expect-error fix types
    this.settings = this._computeSettings();
  }

  _computeSettings() {
    const baseSettings = FOUNDRY_SETTING_IDS.reduce(
      (accum, value) => ({
        ...accum,
        // @ts-expect-error fix types
        [value]: game.settings!.get(MODULE.ID, value),
      }),
      {}
    );

    return {
      ...baseSettings,
      [SETTING_IDS.FORM_SETTINGS]: {
        width: 500,
        height: 352,
      },
    };
  }
}
