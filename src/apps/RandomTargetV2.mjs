import {
  CATEGORY_IDS,
  CHANGE_DEBOUNCE_TIME,
  MIN_SELECTION,
  MODULE,
  POSITION_UPDATE_DEBOUNCE_TIME,
  RERENDER_DEBOUNCE_TIME,
  SETTING_IDS,
  SUBMIT_STATUS_DEBOUNCE_TIME,
} from '../constants.js';
import { CategoryList } from '../lib/CategoryList.js';
import { $M, isTokenDefeated } from '../utils.js';

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
const { SettingsConfig } = foundry.applications.settings;
const { expandObject, mergeObject } = foundry.utils;

export default class RandomTargetV2 extends HandlebarsApplicationMixin(
  ApplicationV2
) {
  static DEFAULT_OPTIONS = {
    classes: [MODULE.ID],
    uniqueId: MODULE.ID,
    position: {
      width: 450,
      height: 'auto',
    },
    tag: 'form',
    window: {
      title: 'Random Target',
      controls: [
        {
          action: 'openSettings',
          label: 'Settings',
        },
        {
          action: 'openHelp',
          label: 'Help',
        },
      ],
      icon: 'fa-solid fa-crosshairs',
      resizable: false,
    },
    actions: {
      openSettings: RandomTargetV2.#handleOpenSettingsAction,
      openHelp: RandomTargetV2.#handleOpenHelpAction,
      closeApp: RandomTargetV2.#handleCloseAppAction,
    },
    form: {
      handler: RandomTargetV2.#handleFormSubmit,
      closeOnSubmit: false,
    },
  };

  static PARTS = {
    tabs: {
      template: 'templates/generic/tab-navigation.hbs',
    },
    content: {
      template: `modules/${MODULE.ID}/templates/v2/random-target/content.hbs`,
    },
    error: {
      template: `modules/${MODULE.ID}/templates/v2/random-target/error.hbs`,
    },
    footer: {
      template: 'templates/generic/form-footer.hbs',
    },
  };

  static TAB_GROUP = 'categories';

  constructor(...args) {
    super(...args);
    this.lastKnownScrollTop = 0;
    this.reRenderTimeout = undefined;
    this.changeTimeout = undefined;
    this.submitStatusTimeout = undefined;
    this.positionUpdateTimeout = undefined;
    this.lastSceneId = undefined;

    // Register the initial scene
    const scene = $M().game.getScene();
    if (scene) {
      this.lastSceneId = scene.id;
    }

    this._configureHooks();
  }

  /**
   * Configures application hooks.
   */
  _configureHooks() {
    // Trigger a re-render whenever the scene changes
    Hooks.on('canvasReady', (...args) => {
      const scene = $M().game.getScene();

      if (scene && this.lastSceneId !== scene.id) {
        this.lastSceneId = scene.id;
        this._triggerDebouncedReRender();
      }
    });

    // Trigger a re-render whenever a relevant setting is updated
    Hooks.on('updateSetting', setting => {
      if ($M().settings.shouldTriggerReRender(setting?.key)) {
        this._triggerDebouncedReRender();
      }
    });

    // Trigger a re-render whenever a target is marked as defeated
    Hooks.on('applyTokenStatusEffect', (_token, statusName) => {
      if (statusName === 'dead') {
        this._triggerDebouncedReRender();
      }
    });

    // Trigger a re-render whenever a combatant has its visibility updated
    Hooks.on('updateCombatant', (_combatant, update) => {
      if (update) {
        this._triggerDebouncedReRender();
      }
    });

    // Trigger a re-render whenever a token changes in the scene
    Hooks.on('createToken', this._triggerDebouncedReRender.bind(this));
    Hooks.on('deleteToken', this._triggerDebouncedReRender.bind(this));
    Hooks.on('updateToken', this._triggerDebouncedReRender.bind(this));
    Hooks.on('controlToken', this._triggerDebouncedReRender.bind(this));

    // Trigger a re-render whenever the current targeted token changes
    Hooks.on('refreshToken', (_token, update) => {
      if (
        update &&
        Object.keys(update).length === 1 &&
        typeof update.refreshTarget === 'boolean'
      ) {
        this._triggerDebouncedReRender();
      }
    });
  }

  /**
   * Triggers a re-render using a debounce.
   */
  _triggerDebouncedReRender() {
    clearTimeout(this.reRenderTimeout);
    this.reRenderTimeout = setTimeout(() => {
      this.render();
    }, RERENDER_DEBOUNCE_TIME);
  }

  /**
   * Handles the 'openSettings' action
   */
  static async #handleOpenSettingsAction() {
    const settingsApp = new SettingsConfig({ initialCategory: MODULE.ID });
    return settingsApp.render(true);
  }

  /**
   * Handles the 'openHelp' action
   */
  static async #handleOpenHelpAction() {
    window.open(
      'https://github.com/mcavallo/foundry-vtt-random-target/wiki/Settings'
    );
  }

  /**
   * Handles the 'closeApp' action
   */
  static async #handleCloseAppAction() {
    this.close();
  }

  /**
   * Handles the form submission
   */
  static async #handleFormSubmit(event, form, formData) {
    if (event.submitter.name !== 'submit') {
      return;
    }

    const settings = expandObject(formData.object);
    const selectedTokens = Array.from(
      new Set(settings.selectedTokens.filter(Boolean))
    );

    // Check for enough selections
    if (selectedTokens.length < MIN_SELECTION) {
      $M().notifications.sendMinimumSelectionError();
      return;
    }

    // Select a random target from the pool of candidates
    const randomPick = $M().random.pickFromPool({
      pool: selectedTokens,
      previousTarget: $M().settings.get(SETTING_IDS.PREV_TARGET_ID),
      avoidSelectingSameTarget: $M().settings.get(
        SETTING_IDS.AVOID_SELECTING_SAME_TARGET
      ),
    });

    // Target token
    const target = $M().game.targetToken(randomPick);

    if (target) {
      $M().settings.set(SETTING_IDS.PREV_TARGET_ID, randomPick);
      $M().chat.sendTargetNotificationMessage(randomPick, selectedTokens);
      $M().notifications.sendTargetNotification(target.name);
    }

    // Close dialog
    if ($M().settings.get(SETTING_IDS.CLOSE_AFTER)) {
      this.close();
    }
  }

  /**
   * Registers the window position.
   */
  _updatePosition(position) {
    const newPosition = super._updatePosition(position);

    if (
      typeof newPosition.top === 'number' &&
      typeof newPosition.left === 'number'
    ) {
      clearTimeout(this.positionUpdateTimeout);
      this.positionUpdateTimeout = setTimeout(() => {
        $M().settings.set(SETTING_IDS.PREV_WINDOW_POSITION, {
          top: newPosition.top,
          left: newPosition.left,
        });
      }, POSITION_UPDATE_DEBOUNCE_TIME);
    }

    return newPosition;
  }

  /**
   * Creates context data for the UI.
   */
  async _prepareContext(options) {
    let context = await super._prepareContext(options);
    const sceneTokens = $M().game.getSceneTokens();

    // If the scene has no tokens avoid preparing the data and return early
    if (sceneTokens.length === 0) {
      return {
        totalSceneTokens: 0,
      };
    }

    const selectedTokens = new Set($M().game.getSelectedTokens());
    const targetedTokens = new Set($M().game.getTargetedTokens());
    const previousSelection = $M().settings.get(SETTING_IDS.PREV_SELECTION) ?? [];

    let totalPreselected = 0;
    const hasEnoughSelected = selectedTokens.size >= MIN_SELECTION;
    const hasEnoughTargeted = targetedTokens.size >= MIN_SELECTION;
    const categories = new CategoryList();

    sceneTokens.forEach(token => {
      const { type, disposition, image } =
        $M().game.getTokenDocumentComputedProps(token);
      const wasPreviouslySelected = previousSelection.includes(token.id);

      const categoryListEntry = {
        id: token.id,
        img: image,
        name: token.name,
        actorId: token.actorId,
        type: type, // Avoid using object property shorthand
        selected: wasPreviouslySelected,
        defeated: isTokenDefeated(token),
        hidden: token.hidden,
      };

      if (wasPreviouslySelected) {
        totalPreselected++;
      }

      categories.addItem(CATEGORY_IDS.ALL, categoryListEntry);

      if (hasEnoughSelected && selectedTokens.has(categoryListEntry.id)) {
        categories.addItem(CATEGORY_IDS.SELECTED, categoryListEntry);
      }

      if (hasEnoughTargeted && targetedTokens.has(categoryListEntry.id)) {
        categories.addItem(CATEGORY_IDS.TARGETED, categoryListEntry);
      }

      if (type) {
        categories.addItem(type, categoryListEntry);
      }

      if (disposition) {
        categories.addItem(disposition, categoryListEntry);
      }
    });

    const sortedCategories = categories.getSortedAndFiltered();

    this._computeActiveTabId(sortedCategories);
    const computedTabs = this._computeAvailableTabs(sortedCategories);
    const computedButtons = this._computeButtons(totalPreselected);

    context = mergeObject(context, {
      totalSceneTokens: sceneTokens.length,
      tabGroupName: RandomTargetV2.TAB_GROUP,
      activeTabId: this.tabGroups[RandomTargetV2.TAB_GROUP],
      tabs: computedTabs,
      categories: sortedCategories,
      areThereTokens: !!categories.getTotalItems(),
      initialSelectionCount: totalPreselected,
      buttons: computedButtons,
    });

    return context;
  }

  /**
   * Creates event listeners.
   */
  _onRender(context, options) {
    // Restore last window position
    const prevPosition = $M().settings.get(SETTING_IDS.PREV_WINDOW_POSITION);
    if (prevPosition && prevPosition?.left && prevPosition?.top) {
      super.setPosition({ left: prevPosition.left, top: prevPosition.top });
    }

    // Toggle error message display
    if (context.totalSceneTokens === 0) {
      this.element.classList.add('error-mode');
    } else {
      this.element.classList.remove('error-mode');
    }

    const scrollableContent = this.element.querySelector('.scrollable-content');

    // Restore the scroll position
    if (this.lastKnownScrollTop > 0) {
      scrollableContent.scrollTop = this.lastKnownScrollTop;
    }

    // Record the scroll position
    scrollableContent.addEventListener('scroll', e => {
      this.lastKnownScrollTop = e.target.scrollTop;
    });

    // Reset the scroll position whenever a tab changes
    this.element.querySelector('[data-tab]')?.addEventListener('click', () => {
      this.lastKnownScrollTop = 0;
    });

    // Handle bulk selection toggle
    this.element.querySelectorAll('.tab .toggleSelection').forEach(el => {
      el.addEventListener('change', this._toggleBulkSelection.bind(this));
    });

    // Handle selection change
    this.element
      .querySelectorAll('input[type="checkbox"]:not(.toggleSelection)')
      .forEach(el => {
        el.addEventListener('change', this._replicateSelectionAcrossTabs.bind(this));
        el.addEventListener('change', () => {
          clearTimeout(this.changeTimeout);
          this.changeTimeout = setTimeout(() => {
            this._computeSubmitButtonState();
            this._saveTemporarySelection();
          }, CHANGE_DEBOUNCE_TIME);
        });
      });

    // Force animated tokens to play
    this.element.querySelectorAll('video[autoplay]').forEach(el => {
      el.play();
    });

    // Compute initial button state
    this._computeSubmitButtonState();
  }

  /**
   * Given a list of categories, it returns the list of available tabs.
   */
  _computeActiveTabId(sortedCategories) {
    if (sortedCategories.length === 0) {
      return;
    }

    // Set the first category as selected if it was not previously set or when
    // the category that was previously selected is no longer present.
    if (!this.tabGroups[RandomTargetV2.TAB_GROUP]) {
      this.tabGroups[RandomTargetV2.TAB_GROUP] = sortedCategories[0].tabId;
      return;
    }

    const availableCategoryIds = new Set(
      sortedCategories.map(category => category.tabId)
    );

    // Reset the selected category to display all tokens when a previously selected
    // category is no longer available.
    if (
      this.tabGroups[RandomTargetV2.TAB_GROUP] &&
      !availableCategoryIds.has(this.tabGroups[RandomTargetV2.TAB_GROUP])
    ) {
      this.tabGroups[RandomTargetV2.TAB_GROUP] = CategoryList.formatTabId(
        CATEGORY_IDS.ALL
      );
    }
  }

  /**
   * Given a list of categories, it returns the list of available tabs.
   */
  _computeAvailableTabs(categories) {
    if (categories.length === 0) {
      return {};
    }

    return categories.reduce((acc, category) => {
      acc[category.tabId] = {
        cssClass:
          this.tabGroups?.[RandomTargetV2.TAB_GROUP] === category.tabId
            ? 'active'
            : '',
        group: RandomTargetV2.TAB_GROUP,
        id: category.tabId,
        label: `${category.label} (${category.totalItems})`,
      };

      return acc;
    }, {});
  }

  /**
   * Returns the list of buttons.
   */
  _computeButtons(selectedTotal) {
    return [
      { type: 'button', label: 'Cancel', action: 'closeApp' },
      {
        type: 'submit',
        label: this._getSubmitLabel(selectedTotal),
        name: 'submit',
        disabled: selectedTotal < MIN_SELECTION,
      },
    ];
  }

  /**
   * Handles the selection toggle bulk action.
   */
  _toggleBulkSelection(e) {
    const newValue = e.target.checked;
    e.target
      .closest('.tab')
      .querySelectorAll('input[type="checkbox"]:not(.toggleSelection)')
      .forEach(el => {
        el.checked = newValue;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
  }

  /**
   * Replicates a selection across multiple category tabs.
   */
  _replicateSelectionAcrossTabs(e) {
    this.element
      .querySelectorAll(`input[type="checkbox"][value="${e.target.value}"]`)
      .forEach(el => {
        el.checked = e.target.checked;
      });
  }

  /**
   * Computes the state of the submit button based on the amount of selections.
   */
  _computeSubmitButtonState() {
    clearTimeout(this.submitStatusTimeout);
    this.submitStatusTimeout = setTimeout(() => {
      const submit = this.element.querySelector(
        'button[type="submit"][name="submit"]'
      );

      if (submit) {
        const checkedIds = this._getSelectedTokenIds();
        const submitContent = submit.querySelector('span');
        submit.disabled = checkedIds.size < MIN_SELECTION;
        submitContent.innerText = this._getSubmitLabel(checkedIds.size);
      }
    }, SUBMIT_STATUS_DEBOUNCE_TIME);
  }

  /**
   * Gets the submit button's label.
   */
  _getSubmitLabel(selectedTotal) {
    return `Choose Random Target (${selectedTotal})`;
  }

  /**
   * Persists the temporary selection.
   */
  _saveTemporarySelection(e) {
    const checkedIds = this._getSelectedTokenIds();
    $M().settings.set(SETTING_IDS.PREV_SELECTION, Array.from(checkedIds));
  }

  /**
   * Returns a set of all selected token ids.
   */
  _getSelectedTokenIds() {
    return new Set(
      Array.from(
        this.element.querySelectorAll(
          'input[type="checkbox"]:not(.toggleSelection):checked'
        )
      ).map(el => el.value)
    );
  }
}

export function runV2() {
  if (!$M().game.getScene()) {
    $M().notifications.sendMissingSceneError();
    return;
  }

  const app = new RandomTargetV2();
  app.render(true);
  return app;
}
