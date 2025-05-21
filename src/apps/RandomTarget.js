import { CATEGORY_IDS, MODULE, PREFERRED_IMAGE, SETTING_IDS } from '../constants.js';
import { CategoryList } from '../lib/CategoryList.js';
import { $M, getIsAnimatedImage, isTokenDefeated } from '../utils.js';

export class RandomTarget extends FormApplication {
  #settingTimeout;
  #controlOrTargetTimeout;
  #settingSavedHandler;
  #tokenControlOrTargetChangedHandler;

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      ...$M().settings.get(SETTING_IDS.FORM_SETTINGS),
      classes: [MODULE.ID],
      popOut: true,
      id: MODULE.ID,
      title: 'Choose Random Target',
      template: `modules/${MODULE.ID}/templates/random-target.hbs`,
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: '.content',
        },
      ],
    });
  }

  constructor(app) {
    super(app);
    this.#settingTimeout = null;
    this.#controlOrTargetTimeout = null;
    this.#settingSavedHandler ||= this._onSettingsSaved.bind(this);
    this.#tokenControlOrTargetChangedHandler ||= this._onTokenControlOrTargetChanged.bind(this);

    Hooks.on('updateSetting', this.#settingSavedHandler);
    Hooks.on('targetToken', this.#tokenControlOrTargetChangedHandler);
    Hooks.on('controlToken', this.#tokenControlOrTargetChangedHandler);
  }

  async close(options = {}) {
    clearTimeout(this.#settingTimeout);
    clearTimeout(this.#controlOrTargetTimeout);
    Hooks.off('updateSetting', this.#settingSavedHandler);
    Hooks.off('targetToken', this.#tokenControlOrTargetChangedHandler);
    Hooks.off('controlToken', this.#tokenControlOrTargetChangedHandler);

    this.diceThrow = null; //remove circular reference
    return super.close(options);
  }

  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();

    return [
      {
        label: 'Settings',
        class: 'settings',
        icon: 'fas fa-gear',
        onclick: async () => this._openSettings(),
      },
      ...buttons,
    ];
  }

  async _openSettings() {
    const settingsApp = new foundry.applications.settings.SettingsConfig({ initialCategory: 'random-target' });
    return settingsApp.render(true);
  }

  _onSettingsSaved(event) {
    if (
      event &&
      [
        `${MODULE.ID}.${SETTING_IDS.CATEGORIES}`,
        `${MODULE.ID}.${SETTING_IDS.PERSIST_SELECTION}`,
        `${MODULE.ID}.${SETTING_IDS.PREFERRED_IMAGE}`,
      ].includes(event.key)
    ) {
      this.render(true);
    }
  }

  _onTokenControlOrTargetChanged() {
    clearTimeout(this.#controlOrTargetTimeout);

    this.#controlOrTargetTimeout = setTimeout(() => {
      this.render(true);
    }, 100);
  }

  _getTokenType(token) {
    if (!token.actor || !token.actor.type) {
      return;
    }

    return CategoryList.formatTypeId(token.actor.type);
  }

  _getTokenActorImage(token) {
    if (!token.actor || !token.actor.img) {
      return;
    }

    return token.actor.img;
  }

  _getTokenImage(token) {
    const preferredImage = $M().settings.get(SETTING_IDS.PREFERRED_IMAGE);
    const actorImage = this._getTokenActorImage(token);
    let image = token.texture.src;

    if (preferredImage === PREFERRED_IMAGE.ACTOR && actorImage) {
      image = actorImage;
    }

    return {
      src: image,
      animated: getIsAnimatedImage(image),
    };
  }

  _getTokenDisposition(token) {
    if (!token.disposition) {
      return;
    }

    return CategoryList.formatDispositionId(token.disposition);
  }

  getData() {
    const data = super.getData();
    const persistSelection = $M().settings.get(SETTING_IDS.PERSIST_SELECTION);

    const tokenCategories = new CategoryList();
    const sortedTokens = $M().game.getSceneTokens();
    const selectedTokens = new Set($M().game.getSelectedTokens());
    const targetedTokens = new Set($M().game.getTargetedTokens());
    const previousSelection = persistSelection ? $M().settings.get(SETTING_IDS.PREV_SELECTION) : [];
    const hasEnoughSelected = selectedTokens.size > 1;
    const hasEnoughTargeted = targetedTokens.size > 1;

    sortedTokens.forEach(token => {
      const type = this._getTokenType(token);
      const disposition = this._getTokenDisposition(token);
      const wasPreviouslySelected = previousSelection.includes(token.id);
      const image = this._getTokenImage(token);

      const categoryListEntry = {
        id: token.id,
        img: image,
        name: token.name,
        actorId: token.actorId,
        type: type, // Avoid using object property shorthand
        selected: wasPreviouslySelected,
        defeated: isTokenDefeated(token),
      };

      tokenCategories.addItem(CATEGORY_IDS.ALL, categoryListEntry);

      if (persistSelection && wasPreviouslySelected) {
        tokenCategories.addItem(CATEGORY_IDS.PREVIOUS, categoryListEntry);
      }

      if (hasEnoughSelected && selectedTokens.has(categoryListEntry.id)) {
        tokenCategories.addItem(CATEGORY_IDS.SELECTED, categoryListEntry);
      }

      if (hasEnoughTargeted && targetedTokens.has(categoryListEntry.id)) {
        tokenCategories.addItem(CATEGORY_IDS.TARGETED, categoryListEntry);
      }

      if (type) {
        tokenCategories.addItem(type, categoryListEntry);
      }

      if (disposition) {
        tokenCategories.addItem(disposition, categoryListEntry);
      }
    });

    data.tokenCategories = tokenCategories.getSortedAndFiltered();
    data.areThereTokens = !!tokenCategories.getTotalItems();
    data.initialSelectionCount = previousSelection.length;

    return data;
  }

  async _updateObject(event, formData) {
    if (event.submitter.name !== 'submit') {
      return;
    }

    // Keep only unique values
    const selectedTokens = (formData.selectedTokens || []).filter(
      (value, idx, arr) => value && arr.indexOf(value) === idx
    );

    if (selectedTokens.length < 2) {
      $M().notifications.sendMinimumSelectionError();
      return;
    }

    const randomPick = this._pickRandomToken(selectedTokens);
    this._targetToken(randomPick, selectedTokens);

    $M().settings.set(SETTING_IDS.PREV_SELECTION, selectedTokens);
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._computeSubmitState(html);

    html.find('.tab .toggleSelection').change(event => this._computeToggleSelection(html, event));
    html.find('input[type="checkbox"]').change(event => {
      this._computeSelectionChange(html, event.target.value, event.target.checked);
      this._computeTotalSelectionCount(html);
      this._computeSubmitState(html);
    });

    // Force animated tokens to play
    html.find('video[autoplay]').each((_, el) => {
      el.play();
    });
  }

  _getCheckedInputs(html, options = {}) {
    const opt = Object.assign({ tab: null, checked: false, unique: false }, options);
    let taken = [];
    let selection = html.find(
      [
        opt.tab ? `[data-tab="${opt.tab}"]` : '',
        '[data-group="target-categories"] input[type="checkbox"]:not(.toggleSelection)',
        opt.checked ? `:checked` : '',
      ].join('')
    );

    if (opt.unique) {
      selection = selection.filter((_, input) => {
        const value = $(input).attr('value');

        if (taken.indexOf(value) === -1) {
          taken.push(value);
          return true;
        }

        return false;
      });
    }

    return selection;
  }

  _getInputsById(html, tokenId) {
    return html.find(`[data-group="target-categories"] input[type="checkbox"][value="${tokenId}"]`);
  }

  _computeSelectionChange(html, tokenId, newState) {
    // Replicate the selection change in other categories that have the same token
    this._getInputsById(html, tokenId).each((_, input) => {
      input.checked = newState;
    });
  }

  _computeToggleSelection(html, event) {
    const type = event.target.value;
    const newState = event.target.checked;

    this._getCheckedInputs(html, { tab: type }).each((_, input) => {
      this._computeSelectionChange(html, input.value, newState);
    });
  }

  _computeTotalSelectionCount(html) {
    const inputs = this._getCheckedInputs(html, { checked: true, unique: true });
    html.find(`.selected-tokens-count`).html(`(${inputs.length})`);
  }

  _computeSubmitState(html) {
    const totalChecked = this._getCheckedInputs(html, { checked: true, unique: true }).length;
    html.find(`button[type="submit"][name="submit"]`).attr('disabled', totalChecked < 2);
  }

  _pickRandomToken(selectedTokens) {
    const previousTarget = $M().settings.get(SETTING_IDS.PREV_TARGET_ID);
    const avoidSelectingSameTarget = $M().settings.get(SETTING_IDS.AVOID_SELECTING_SAME_TARGET);
    let randomPick;

    while (!randomPick || (avoidSelectingSameTarget && randomPick === previousTarget)) {
      const idx = $M().random.getOne(selectedTokens.length);
      randomPick = selectedTokens[idx];
    }

    return randomPick;
  }

  _targetToken(tokenId, candidatesIds) {
    const target = $M().game.targetToken(tokenId);

    if (target) {
      $M().settings.set(SETTING_IDS.PREV_TARGET_ID, tokenId);
      $M().chat.sendTargetNotificationMessage(tokenId, candidatesIds);
      $M().notifications.sendTargetNotification(target.name);
    }
  }
}

export function run() {
  if (!$M().game.getScene()) {
    $M().notifications.sendMissingSceneError();
    return;
  }

  const app = new RandomTarget();
  app.render(true);
  return app;
}
