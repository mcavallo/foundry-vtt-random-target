import type { Category, TargetAppRenderingContext } from '#/types/module.ts';
import {
  CATEGORY_IDS,
  CHANGE_DEBOUNCE_TIME,
  EMPTY_TARGET_CONTEXT,
  MIN_SCENE_SELECTION_TOKENS,
  MIN_SELECTION_TOKENS,
  MODULE,
  POSITION_UPDATE_DEBOUNCE_TIME,
  RERENDER_DEBOUNCE_TIME,
  SETTING_IDS,
  SETTINGS_URL,
  SUBMIT_STATUS_DEBOUNCE_TIME,
  TAB_GROUP,
} from '@/constants';
import { CategoryList } from '@/lib/CategoryList';
import { $M, formatTabId, isInputEvent, isValidFormSubmit } from '@/lib/utils.ts';
// @ts-expect-error this import has issues but the types are working fine
import type ApplicationV2 from 'fvtt-types/src/foundry/client/applications/api/application';
import SupportDialog from './SupportDialog';

export default class TargetApp extends foundry.applications.api.HandlebarsApplicationMixin(
  foundry.applications.api.ApplicationV2<TargetAppRenderingContext>
) {
  private lastKnownScrollTop: number;
  private reRenderTimeout?: ReturnType<typeof setTimeout>;
  private changeTimeout?: ReturnType<typeof setTimeout>;
  private submitStatusTimeout?: ReturnType<typeof setTimeout>;
  private positionUpdateTimeout?: ReturnType<typeof setTimeout>;
  private lastSceneId?: string;
  private previouslySelectedIds: Set<string> = new Set();

  static DEFAULT_OPTIONS = {
    classes: [MODULE.ID],
    id: MODULE.ID,
    position: {
      width: 450,
      height: 'auto' as ApplicationV2.Position,
    },
    tag: 'form',
    window: {
      title: game?.i18n?.localize('RANDOMTARGET.Name') ?? MODULE.NAME,
      controls: [
        {
          action: 'openSettings',
          label: game?.i18n?.localize('RANDOMTARGET.Settings') ?? 'Settings',
          icon: 'fa-solid fa-gear',
        },
        {
          action: 'openHelp',
          label: game?.i18n?.localize('RANDOMTARGET.Help') ?? 'Help',
          icon: 'fa-solid fa-circle-info',
        },
        {
          action: 'openSupport',
          label: game?.i18n?.localize('RANDOMTARGET.Support') ?? 'Support',
          icon: 'fa-solid fa-heart',
        },
      ],
      icon: 'fa-solid fa-bullseye',
      resizable: false,
    },
    actions: {
      openSettings: TargetApp.#handleOpenSettingsAction,
      openHelp: TargetApp.#handleOpenHelpAction,
      openSupport: TargetApp.#handleOpenSupportAction,
      closeApp: TargetApp.#handleCloseAppAction,
    },
    form: {
      handler: TargetApp.#handleFormSubmit,
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
    status: {
      template: `modules/${MODULE.ID}/templates/v2/random-target/status.hbs`,
    },
  };

  constructor(...args: ConstructorParameters<typeof ApplicationV2>) {
    super(...args);
    this.lastKnownScrollTop = 0;
    this.reRenderTimeout = undefined;
    this.changeTimeout = undefined;
    this.submitStatusTimeout = undefined;
    this.positionUpdateTimeout = undefined;
    this.lastSceneId = undefined;

    this._registerInitialScene();
    this._configureHooks();
  }

  /**
   * Registers the initial scene where the app was initially started.
   */
  _registerInitialScene() {
    const scene = $M().game.getScene();
    if (scene) {
      this.lastSceneId = scene.id;
    }
  }

  /**
   * Configures application hooks.
   */
  _configureHooks() {
    // Trigger a re-render whenever the scene changes
    Hooks.on('canvasReady', () => {
      const scene = $M().game.getScene();

      if (scene && this.lastSceneId !== scene.id) {
        this.lastSceneId = scene.id;
        this._triggerDebouncedReRender();
      }
    });

    // Trigger a re-render whenever a relevant setting is updated
    Hooks.on('updateSetting', (setting) => {
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
    Hooks.on(
      'refreshToken',
      (_token: Token, update?: { refreshTarget?: boolean }) => {
        if (
          update &&
          Object.keys(update).length === 1 &&
          typeof update.refreshTarget === 'boolean'
        ) {
          this._triggerDebouncedReRender();
        }
      }
    );
  }

  /**
   * Triggers a re-render using a debounce.
   */
  _triggerDebouncedReRender() {
    clearTimeout(this.reRenderTimeout);
    this.reRenderTimeout = setTimeout(() => {
      void this.render();
    }, RERENDER_DEBOUNCE_TIME);
  }

  /**
   * Handles the 'openSettings' action
   */
  static async #handleOpenSettingsAction() {
    void new foundry.applications.settings.SettingsConfig({
      initialCategory: MODULE.ID,
    }).render({ force: true });
  }

  /**
   * Handles the 'openHelp' action
   */
  static async #handleOpenHelpAction() {
    window.open(SETTINGS_URL, '_blank');
  }

  /**
   * Handles the 'openSupport' action
   */
  static async #handleOpenSupportAction() {
    void new SupportDialog().render({ force: true });
  }

  /**
   * Handles the 'closeApp' action
   */
  static async #handleCloseAppAction() {
    // @ts-expect-error fix types here
    void this.close();
  }

  /**
   * Handles the form submission
   */
  static async #handleFormSubmit(
    e: Event | SubmitEvent,
    _form: HTMLFormElement,
    formData: FormDataExtended
  ) {
    if (!isValidFormSubmit(e)) {
      return;
    }

    const values = foundry.utils.expandObject(formData.object) as {
      selectedTokens: string[];
    };
    const selectedTokens = Array.from(
      new Set(values.selectedTokens.filter(Boolean))
    );

    // Check for enough selections
    if (selectedTokens.length < MIN_SELECTION_TOKENS) {
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
      // @ts-expect-error fix types here
      void this.close();
    }
  }

  /**
   * Registers the window position.
   */
  _updatePosition(position: any) {
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
  async _prepareContext(
    options: ApplicationV2.RenderContext
  ): Promise<TargetAppRenderingContext> {
    let prevContext = await super._prepareContext(options);
    const sceneTokens = $M().game.getSceneTokens();

    // If the scene has no tokens avoid preparing the data and return early
    if (sceneTokens.length === 0) {
      return foundry.utils.mergeObject(prevContext, EMPTY_TARGET_CONTEXT);
    }

    const previouslySelectedIds = this.previouslySelectedIds.union(
      new Set($M().settings.get(SETTING_IDS.PREV_SELECTION) ?? [])
    );

    const categories = new CategoryList();
    const preselectedTokenIds = new Set<string>();
    const sceneSelectedTokens = new Set($M().game.getSceneSelectedTokens());
    const sceneTargetedTokens = new Set($M().game.getSceneTargetedTokens());
    const hasEnoughSelected = sceneSelectedTokens.size >= MIN_SCENE_SELECTION_TOKENS;
    const hasEnoughTargeted = sceneTargetedTokens.size >= MIN_SCENE_SELECTION_TOKENS;

    for (const token of sceneTokens) {
      const tokenId = token.id!;
      const wasPreviouslySelected = previouslySelectedIds.has(tokenId);
      const { defeated, disposition, image, name, type } =
        $M().game.getTokenDocumentComputedProps(token);

      const categoryListEntry = {
        id: tokenId,
        image,
        name,
        actorId: token.actorId,
        type,
        selected: wasPreviouslySelected,
        defeated,
        hidden: token.hidden,
      };

      if (wasPreviouslySelected) {
        preselectedTokenIds.add(tokenId);
      }

      categories.addItem(CATEGORY_IDS.ALL, categoryListEntry);

      if (hasEnoughSelected && sceneSelectedTokens.has(tokenId)) {
        categories.addItem(CATEGORY_IDS.SELECTED, categoryListEntry);
      }

      if (hasEnoughTargeted && sceneTargetedTokens.has(tokenId)) {
        categories.addItem(CATEGORY_IDS.TARGETED, categoryListEntry);
      }

      if (type) {
        categories.addItem(type, categoryListEntry);
      }

      if (disposition) {
        categories.addItem(disposition, categoryListEntry);
      }
    }

    const sortedCategories = categories.getSortedAndFiltered();
    this._setActiveTab(sortedCategories);
    const computedTabs = this._computeAvailableTabs(sortedCategories);

    this.previouslySelectedIds = new Set(preselectedTokenIds);
    const computedButtons = this._computeButtons(preselectedTokenIds.size);

    const chatVisibility = $M().settings.get(
      SETTING_IDS.CHAT_NOTIFICATIONS
    ) as string;

    const newContext: Required<TargetAppRenderingContext> = {
      ...EMPTY_TARGET_CONTEXT,
      activeTabId: this.tabGroups[TAB_GROUP],
      buttons: computedButtons,
      categories: sortedCategories,
      chatVisibility,
      tabGroupName: TAB_GROUP,
      tabs: computedTabs,
      totalSceneTokens: sceneTokens.length,
      totalTokens: categories.getTotalItems(),
    };

    return foundry.utils.mergeObject(prevContext, newContext);
  }

  /**
   * Creates event listeners.
   */
  async _onRender(context: TargetAppRenderingContext) {
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

    const scrollableContent =
      this.element.querySelector<HTMLDivElement>('.scrollable-content');

    if (scrollableContent) {
      // Restore the scroll position
      if (this.lastKnownScrollTop > 0) {
        scrollableContent.scrollTop = this.lastKnownScrollTop;
      }

      // Record the scroll position
      scrollableContent.addEventListener('scroll', (e) => {
        if (e.target) {
          this.lastKnownScrollTop = (e.target as HTMLDivElement).scrollTop;
        }
      });
    }

    // Reset the scroll position whenever a tab changes
    this.element.querySelector('[data-tab]')?.addEventListener('click', () => {
      this.lastKnownScrollTop = 0;
    });

    // Handle bulk selection toggle
    this.element
      .querySelectorAll<HTMLInputElement>(
        '.tab input[type="checkbox"].toggleSelection'
      )
      .forEach((el) => {
        el.addEventListener('change', this._toggleBulkSelection.bind(this));
      });

    // Handle selection change
    this.element
      .querySelectorAll('input[type="checkbox"]:not(.toggleSelection)')
      .forEach((el) => {
        el.addEventListener('change', this._replicateSelectionAcrossTabs.bind(this));
        el.addEventListener('change', () => {
          clearTimeout(this.changeTimeout);
          this.changeTimeout = setTimeout(() => {
            this.previouslySelectedIds = new Set(this._getSelectedTokenIds());
            this._computeUIState(this.previouslySelectedIds, context.categories);
            this._saveTemporarySelection(this.previouslySelectedIds);
          }, CHANGE_DEBOUNCE_TIME);
        });
      });

    // Force animated tokens to play
    this.element
      .querySelectorAll<HTMLMediaElement>('video[autoplay]')
      .forEach((el) => {
        void el.play();
      });

    // Compute UI state during a render
    this._computeUIState(this.previouslySelectedIds, context.categories);
  }

  /**
   * Computes the state for the dynamic UI elements.
   */
  _computeUIState(selectedIds: Set<string>, categories?: Category[]) {
    this._computeSubmitButtonState(selectedIds);
    this._computeFeedbackState(selectedIds);
    this._computeCategoriesCandidatesIndicator(selectedIds, categories);
  }

  /**
   * Given a list of categories, it sets the current active tab.
   */
  _setActiveTab(sortedCategories: Category[]) {
    if (sortedCategories.length === 0) {
      return;
    }

    const selectionCategory = sortedCategories.find(
      (category) => category.id === CATEGORY_IDS.SELECTED
    );
    const targetedCategory = sortedCategories.find(
      (category) => category.id === CATEGORY_IDS.TARGETED
    );

    // Prioritize the selection category first
    if (
      selectionCategory &&
      selectionCategory.enabled &&
      selectionCategory.totalItems > 0
    ) {
      this.tabGroups[TAB_GROUP] = selectionCategory.tabId;
      return;
    }

    // Prioritize the targeted category next
    if (
      targetedCategory &&
      targetedCategory.enabled &&
      targetedCategory.totalItems > 0
    ) {
      this.tabGroups[TAB_GROUP] = targetedCategory.tabId;
      return;
    }

    // Set the first category as selected if it was not previously set or when
    // the category that was previously selected is no longer present.
    if (!this.tabGroups[TAB_GROUP]) {
      this.tabGroups[TAB_GROUP] = sortedCategories[0].tabId;
      return;
    }

    const availableCategoryIds = new Set(
      sortedCategories.map((category) => category.tabId)
    );

    // Reset the selected category to display all tokens when a previously selected
    // category is no longer available.
    if (
      this.tabGroups[TAB_GROUP] &&
      !availableCategoryIds.has(this.tabGroups[TAB_GROUP] ?? '')
    ) {
      this.tabGroups[TAB_GROUP] = formatTabId(CATEGORY_IDS.ALL);
    }
  }

  /**
   * Given a list of categories, it returns the list of available tabs.
   */
  _computeAvailableTabs(categories: Category[]): Record<string, ApplicationV2.Tab> {
    if (categories.length === 0) {
      return {};
    }

    return categories.reduce(
      (acc, category) => {
        acc[category.tabId] = {
          cssClass: this.tabGroups?.[TAB_GROUP] === category.tabId ? 'active' : '',
          group: TAB_GROUP,
          id: category.tabId,
          label: `${category.label} (${category.totalItems})`,
        };

        return acc;
      },
      {} as Record<string, ApplicationV2.Tab>
    );
  }

  /**
   * Returns the list of buttons.
   */
  _computeButtons(selectedTotal: number): ApplicationV2.FormFooterButton[] {
    return [
      { type: 'button', label: 'Cancel', action: 'closeApp' },
      {
        type: 'submit',
        label: 'Choose Random Target',
        name: 'submit',
        disabled: selectedTotal < MIN_SELECTION_TOKENS,
      },
    ];
  }

  /**
   * Handles the selection toggle bulk action.
   */
  _toggleBulkSelection(e: Event) {
    if (isInputEvent(e)) {
      e.target
        ?.closest<HTMLDivElement>('.tab')
        ?.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]:not(.toggleSelection)'
        )
        .forEach((el) => {
          el.checked = e.target.checked;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
  }

  /**
   * Replicates a selection across multiple category tabs.
   */
  _replicateSelectionAcrossTabs(e: Event) {
    if (isInputEvent(e)) {
      this.element
        .querySelectorAll<HTMLInputElement>(
          `input[type="checkbox"][value="${e.target.value}"]`
        )
        .forEach((el) => {
          el.checked = e.target.checked;
        });
    }
  }

  /**
   * Computes the state of the submit button.
   */
  _computeSubmitButtonState(selectedIds: Set<string>) {
    clearTimeout(this.submitStatusTimeout);
    this.submitStatusTimeout = setTimeout(() => {
      const submit = this.element.querySelector<HTMLInputElement>(
        'button[type="submit"][name="submit"]'
      );

      if (submit) {
        submit.disabled = selectedIds.size < MIN_SELECTION_TOKENS;
      }
    }, SUBMIT_STATUS_DEBOUNCE_TIME);
  }

  /**
   * Computes the state of the status bar elements.
   */
  _computeFeedbackState(selectedIds: Set<string>) {
    const candidatesValue = this.element.querySelector<HTMLDivElement>(
      '.form-status [data-id="candidates-status-value"]'
    );

    if (candidatesValue) {
      candidatesValue.classList.toggle('status-value-muted', selectedIds.size === 0);
      candidatesValue.innerText = this._getCandidatesStatusValue(selectedIds.size);
    }
  }

  /**
   * Computes the state for categories candidates indicator.
   */
  _computeCategoriesCandidatesIndicator(
    selectedIds: Set<string>,
    categories?: Category[]
  ) {
    if (!categories || selectedIds.size === 0) {
      this.element.querySelectorAll(`[data-action="tab"]`).forEach((el) => {
        el.classList.toggle('has-selected-candidates', false);
      });
      return;
    }

    for (const category of categories) {
      const indicatorStatus =
        ![CATEGORY_IDS.ALL].includes(category.id) &&
        category.totalItems > 0 &&
        category.items.filter((item) => selectedIds.has(item.id)).length > 0;

      const tab = this.element.querySelector(
        `[data-action="tab"][data-tab="${category.tabId}"]`
      );

      if (tab) {
        tab.classList.toggle('has-selected-candidates', indicatorStatus);
      }
    }
  }

  /**
   * Persists the temporary selection.
   */
  _saveTemporarySelection(selectedIds: Set<string>) {
    $M().settings.set(SETTING_IDS.PREV_SELECTION, Array.from(selectedIds));
  }

  /**
   * Returns a set of all selected token ids.
   */
  _getSelectedTokenIds() {
    return new Set(
      Array.from(
        this.element.querySelectorAll<HTMLInputElement>(
          'input[type="checkbox"]:not(.toggleSelection):checked'
        )
      ).map((el) => el.value)
    );
  }

  /**
   * Returns the generated label for the candidates status value.
   */
  _getCandidatesStatusValue(total: number) {
    if (total === 0) {
      return game?.i18n?.localize('RANDOMTARGET.NoCandidatesSelected') ?? '';
    } else {
      return (
        game?.i18n?.format('RANDOMTARGET.CandidatesSelected', {
          total: total.toString(),
        }) ?? ''
      );
    }
  }
}

export const run = () => {
  if (!$M().game.getScene()) {
    $M().notifications.sendMissingSceneError();
    return;
  }

  const app = new TargetApp();
  void app.render({ force: true });
  return app;
};
