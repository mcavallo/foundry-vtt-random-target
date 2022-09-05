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
    const tokenCategories = {};

    game.scenes.active.tokens.forEach(token => {
      const type = token._actor.type;

      if (!type) {
        return;
      }

      if (!tokenCategories[type]) {
        tokenCategories[type] = {
          id: type,
          label: type,
          items: [],
          totalItems: 0,
        };
      }

      tokenCategories[type].items.push({
        id: token.id,
        img: token.texture.src,
        name: token.name,
        actorId: token.actorId,
        type,
        selected: false,
      });
      tokenCategories[type].totalItems++;
    });

    data.tokenCategories = tokenCategories;
    data.areThereTokens = !!Object.keys(tokenCategories).length;
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
