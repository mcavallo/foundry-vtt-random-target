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
      const type = token.actor.data.type;

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
        id: token.data._id,
        img: token.data.img,
        name: token.data.name,
        actorId: token.data.actorId,
        type,
        selected: false,
      });
      tokenCategories[type].totalItems++;
    });

    data.tokenCategories = tokenCategories;

    return data;
  }

  async _updateObject(event, formData) {
    const { selectedTokens = [] } = formData;

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

    html.find('.tab .toggleSelection').change(event => this._computeToggleSelection(html, event));
    html.find('input[type="checkbox"]').change(event => this._computeTotalSelectionCount(html, event));
  }

  _computeToggleSelection(html, event) {
    const type = event.target.value;
    const newState = event.target.checked;
    const inputs = html.find(
      `[data-tab="${type}"][data-group="target-categories"] input[type="checkbox"]:not(.toggleSelection)`
    );

    inputs.each((_, input) => {
      input.checked = newState;
    });
  }

  _computeTotalSelectionCount(html, _event) {
    const inputs = html.find(`[data-group="target-categories"] input[type="checkbox"]:not(.toggleSelection):checked`);
    html.find(`.selected-tokens-count`).html(`(${inputs.length})`);
  }

  _targetToken(tokenId) {
    const target = canvas.tokens.objects.children.find(token => token.id === tokenId);

    if (target) {
      target.setTarget(true, { releaseOthers: true });
      ui.notifications.info(`<b>${target.data.name}</b> targeted`, {});
      canvas.animatePan(target._validPosition);
    }
  }
}

export function run() {
  const app = new RandomTarget();
  app.render(true);
  return app;
}
