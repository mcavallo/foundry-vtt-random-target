const FIXED_CATEGORIES = {
  ALL: { id: 'all', order: 3 },
  SELECTED: { id: 'selected', order: 2 },
  TARGETED: { id: 'targeted', order: 1 },
};

class CategoryList {
  constructor() {
    this.categories = {};
  }

  add(id, token) {
    if (!this.categories[id]) {
      this.categories[id] = {
        id,
        label: id,
        items: [],
        totalItems: 0,
      };
    }

    this.categories[id].items.push(token);
    this.categories[id].totalItems++;
  }

  getSorted() {
    const orderMap = Object.keys(FIXED_CATEGORIES).reduce(
      (accum, key) => ({
        ...accum,
        [FIXED_CATEGORIES[key].id]: FIXED_CATEGORIES[key].order,
      }),
      {}
    );

    const sortedCategoryKeys = Object.keys(this.categories).sort((a, b) => {
      if (orderMap[a] && orderMap[b]) {
        return orderMap[a] - orderMap[b];
      }

      if (orderMap[a]) {
        return -1;
      }

      if (orderMap[b]) {
        return 1;
      }

      if (a < b) {
        return -1;
      }

      if (a > b) {
        return 1;
      }

      return 0;
    });

    return sortedCategoryKeys.reduce(
      (accum, key) => ({
        ...accum,
        [key]: this.categories[key],
      }),
      {}
    );
  }

  count() {
    return Object.keys(this.categories).length;
  }
}

export class RandomTarget extends FormApplication {
  constructor(app) {
    super(app);
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      ...game.randomTarget.settings.formSettings,
      classes: ['randomtarget'],
      popOut: true,
      id: 'random-target',
      title: 'Choose Random Target',
      template: 'modules/random-target/templates/random-target.hbs',
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: '.content',
        },
      ],
    });
  }

  getData() {
    const data = super.getData();
    const tokenCategories = new CategoryList();
    const sortedTokens = game.scenes.active.tokens.contents.sort(game.randomTarget.utils.sortTokensByName);
    const selectedTokens = new Set(canvas.tokens.controlled.map(token => token.id));
    const targetedTokens = new Set(game.user.targets.map(token => token.id));
    const showSelectedCategory = selectedTokens.size > 1;
    const showTargetedCategory = targetedTokens.size > 1;

    sortedTokens.forEach(token => {
      const type = token._actor.type;

      const categoryListEntry = {
        id: token.id,
        img: token.texture.src,
        name: token.name,
        actorId: token.actorId,
        type,
        selected: false,
        defeated: game.randomTarget.utils.isTokenDefeated(token),
      };

      tokenCategories.add(FIXED_CATEGORIES.ALL.id, categoryListEntry);

      if (showSelectedCategory && selectedTokens.has(categoryListEntry.id)) {
        tokenCategories.add(FIXED_CATEGORIES.SELECTED.id, categoryListEntry);
      }

      if (showTargetedCategory && targetedTokens.has(categoryListEntry.id)) {
        tokenCategories.add(FIXED_CATEGORIES.TARGETED.id, categoryListEntry);
      }

      if (type) {
        tokenCategories.add(type, categoryListEntry);
      }
    });

    data.tokenCategories = tokenCategories.getSorted();
    data.areThereTokens = !!tokenCategories.count();

    return data;
  }

  async _updateObject(event, formData) {
    const selectedTokens = (formData.selectedTokens || []).filter(Boolean);

    if (event.submitter.name !== 'submit') {
      return;
    }

    if (selectedTokens.length < 2) {
      ui.notifications.error('You need to select at least 2 tokens', {});
      return;
    }

    const randomPick = selectedTokens[Math.floor(Math.random() * selectedTokens.length)];
    this._targetToken(randomPick);
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._computeSubmitState(html);

    html.find('.tab .toggleSelection').change(event => this._computeToggleSelection(html, event));
    html.find('input[type="checkbox"]').change(event => {
      this._computeTotalSelectionCount(html, event);
      this._computeSubmitState(html);
    });
  }

  _getCheckedInputs(html, options = { tab: null, checked: false }) {
    const parts = [
      options.tab ? `[data-tab="${options.tab}"]` : '',
      '[data-group="target-categories"] input[type="checkbox"]:not(.toggleSelection)',
      options.checked ? `:checked` : '',
    ];

    return html.find(parts.join(''));
  }

  _computeToggleSelection(html, event) {
    const type = event.target.value;
    const newState = event.target.checked;

    this._getCheckedInputs(html, { tab: type }).each((_, input) => {
      input.checked = newState;
    });
  }

  _computeTotalSelectionCount(html, _event) {
    const inputs = this._getCheckedInputs(html, { checked: true });
    html.find(`.selected-tokens-count`).html(`(${inputs.length})`);
  }

  _computeSubmitState(html) {
    const totalChecked = this._getCheckedInputs(html, { checked: true }).length;
    html.find(`button[type="submit"][name="submit"]`).attr('disabled', totalChecked < 2);
  }

  _targetToken(tokenId) {
    const target = canvas.tokens.objects.children.find(token => token.id === tokenId);

    if (!target) {
      return;
    }

    target.setTarget(true, { releaseOthers: true });
    ui.notifications.info(`<b>${target.name}</b> targeted`, {});
    canvas.animatePan(target.position);
  }
}

export function run() {
  const app = new RandomTarget();
  app.render(true);
  return app;
}
