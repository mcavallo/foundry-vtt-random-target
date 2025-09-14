import { CategoriesSettings } from '@/apps/CategoriesSettings.js';
import {
  BASE_CATEGORIES,
  CHAT_NOTIFICATIONS,
  FOUNDRY_SETTING_IDS,
  MODULE,
  PREFERRED_IMAGE,
  SETTING_IDS,
  SYSTEM_IDS,
} from '../constants.js';
import { stripSettingNamespace, t } from './utils.js';

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

    return [
      SETTING_IDS.CATEGORIES,
      SETTING_IDS.PREFERRED_IMAGE,
      SETTING_IDS.CHAT_NOTIFICATIONS,
    ].includes(stripSettingNamespace(key));
  }

  _registerSettings() {
    // Sanity check to ensure the settings registration happens if the game is ready
    if (!game.settings) {
      return;
    }

    game.settings.registerMenu(MODULE.ID, SETTING_IDS.CATEGORIES + 'Menu', {
      name: t('settings.categoryFilters.name'),
      label: t('settings.categoryFilters.label'),
      hint: t('settings.categoryFilters.hint'),
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
      name: t('settings.closeAfterSelection.name'),
      hint: t('settings.closeAfterSelection.hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.CHAT_NOTIFICATIONS, {
      name: t('settings.chatNotifications.name'),
      hint: t('settings.chatNotifications.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        [CHAT_NOTIFICATIONS.DISABLED]: t(
          'settings.chatNotifications.options.disabled'
        ),
        [CHAT_NOTIFICATIONS.GM_ONLY]: t('settings.chatNotifications.options.gm'),
        [CHAT_NOTIFICATIONS.PUBLIC]: t('settings.chatNotifications.options.public'),
      },
      default: CHAT_NOTIFICATIONS.DISABLED,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.AVOID_SELECTING_SAME_TARGET, {
      name: t('settings.avoidSameTarget.name'),
      hint: t('settings.avoidSameTarget.hint'),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
      onChange: this._updateSettings.bind(this),
    });

    // @ts-expect-error fix types
    game.settings.register(MODULE.ID, SETTING_IDS.PREFERRED_IMAGE, {
      name: t('settings.preferredTargetImage.name'),
      hint: t('settings.preferredTargetImage.hint'),
      scope: 'world',
      config: true,
      type: String,
      choices: {
        [PREFERRED_IMAGE.TOKEN]: t('settings.preferredTargetImage.options.token'),
        [PREFERRED_IMAGE.ACTOR]: t('settings.preferredTargetImage.options.actor'),
      },
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
