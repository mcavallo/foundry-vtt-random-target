import { MODULE, CATEGORY_IDS, SETTING_IDS } from '../constants.js';
import { isTokenDefeated, sortTokensByName } from '../utils.js';
import { CategoryList } from '../lib/CategoryList.js';

export class RandomTarget extends FormApplication {
  #settingTimeout;
  #controlOrTargetTimeout;
  #settingSavedHandler;
  #tokenControlOrTargetChangedHandler;

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      ...game.randomTarget.settings[SETTING_IDS.FORM_SETTINGS],
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
        onclick: () => this._openSettings(),
      },
      ...buttons,
    ];
  }

  _openSettings() {
    const settingsApp = new SettingsConfig().render(true);
    let callLimit = 20;

    // Nasty hack to get the right settings page open
    const attemptTabSwitch = () => {
      clearTimeout(this.#settingTimeout);
      callLimit--;

      if (callLimit < 0) {
        return;
      }

      try {
        settingsApp.activateTab('random-target');
        return;
      } catch (_) {
        this.#settingTimeout = setTimeout(attemptTabSwitch, 100);
      }
    };

    attemptTabSwitch();
  }

  _onSettingsSaved(event) {
    if (event && event.key === `${MODULE.ID}.${SETTING_IDS.CATEGORIES}`) {
      this.render(true);
    }
  }

  _onTokenControlOrTargetChanged() {
    clearTimeout(this.#controlOrTargetTimeout);

    this.#controlOrTargetTimeout = setTimeout(() => {
      this.render(true);
    }, 100);
  }

  getData() {
    const data = super.getData();
    const tokenCategories = new CategoryList();
    const sortedTokens = game.scenes.active.tokens.contents.sort(sortTokensByName);
    const selectedTokens = new Set(canvas.tokens.controlled.map(token => token.id));
    const targetedTokens = new Set(game.user.targets.map(token => token.id));
    const hasEnoughSelected = selectedTokens.size > 1;
    const hasEnoughTargeted = targetedTokens.size > 1;

    sortedTokens.forEach(token => {
      const type = CategoryList.formatTypeId(token._actor.type);
      const disposition = CategoryList.formatDispositionId(token.disposition);

      const categoryListEntry = {
        id: token.id,
        img: token.texture.src,
        name: token.name,
        actorId: token.actorId,
        type,
        selected: false,
        defeated: isTokenDefeated(token),
      };

      tokenCategories.addItem(CATEGORY_IDS.ALL, categoryListEntry);

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
      this._sendErrorUINotification();
      return;
    }

    const randomPick = selectedTokens[Math.floor(Math.random() * selectedTokens.length)];
    this._targetToken(randomPick, selectedTokens);
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
  }

  _getCheckedInputs(html, options = { tab: null, checked: false, unique: false }) {
    let taken = [];
    let selection = html.find(
      [
        options.tab ? `[data-tab="${options.tab}"]` : '',
        '[data-group="target-categories"] input[type="checkbox"]:not(.toggleSelection)',
        options.checked ? `:checked` : '',
      ].join('')
    );

    if (options.unique) {
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

  _targetToken(tokenId, candidatesIds) {
    const target = canvas.tokens.objects.children.find(token => token.id === tokenId);

    if (!target) {
      return;
    }

    target.setTarget(true, { releaseOthers: true });
    this._sendSuccessUINotification(target);
    this._sendChatNotification(target, candidatesIds);
    canvas.animatePan(target.position);
  }

  _sendSuccessUINotification(target) {
    ui.notifications.info(`<b>${target.name}</b> targeted`, {});
  }

  _sendErrorUINotification() {
    ui.notifications.error('You need to select at least 2 tokens', {});
  }

  _sendChatNotification(target, candidatesIds) {
    if (!game.randomTarget.settings[SETTING_IDS.CHAT_NOTIFICATION]) {
      return;
    }

    const candidatesPool = candidatesIds
      .map(tokenId => {
        const candidate = canvas.tokens.objects.children.find(token => token.id === tokenId);
        const isSelected = candidate && candidate.id === target.id;
        const name = candidate ? candidate.name : `Unknown token (${tokenId})`;
        return `<li><span${isSelected ? ' class="target"' : ''}>${name}</span></li>`;
      })
      .join('');

    const recipients = game.randomTarget.settings[SETTING_IDS.CHAT_NOTIFICATION_PUBLIC]
      ? null
      : ChatMessage.getWhisperRecipients('GM').map(recipient => recipient.id);

    ChatMessage.create({
      speaker: { alias: 'Random Target' },
      whisper: recipients,
      content: `
        <div class="${MODULE.ID}-message">
          <div class="dice-roll">
              <div class="dice-result">
                <div>
                  <strong>${target.name}</strong> was randomly selected.
                </div>
                <div class="dice-tooltip">
                  <section>
                    The pool of candidates for this selection:
                    <ul>${candidatesPool}</ul>
                  </section>
                </div>
              </div>
            </div>
        </div>
      `,
    });
  }
}

export function run() {
  const app = new RandomTarget();
  app.render(true);
  return app;
}
