import { MODULE, SETTING_IDS } from '@/constants';
import { CategoryList } from '@/lib/CategoryList';
import { $M, isElementEvent, t } from '@/lib/utils.ts';

const { FormApplication } = foundry.appv1.api;

export class CategoriesSettings extends FormApplication {
  // @ts-expect-error fix types here
  #dragEndHandler;
  private draggedId: string | null;

  constructor(...args: ConstructorParameters<typeof FormApplication>) {
    super(...args);
    this.draggedId = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['form', MODULE.ID],
      popOut: true,
      id: `${MODULE.ID}-categories-setting`,
      title: t('categoriesSettings.window.title'),
      template: `modules/${MODULE.ID}/templates/categories-setting.hbs`,
      dragDrop: [
        { dragSelector: '.item-list .item', dropSelector: '.item-list .item' },
      ],
      width: 400,
    });
  }

  activateListeners(html: JQuery<HTMLElement>) {
    super.activateListeners(html);
    this.#dragEndHandler ||= this._onDragEnd.bind(this);
    document.addEventListener('dragend', this.#dragEndHandler);
  }

  async close(options: FormApplication.CloseOptions) {
    document.removeEventListener('keydown', this.#dragEndHandler);
    return super.close(options);
  }

  /**
   * Returns the translations to be used in the rendering context.
   */
  _prepareContextTranslations() {
    return {
      instructions: t('categoriesSettings.content.instructions'),
      buttons: {
        save: t('categoriesSettings.ui.buttons.save.label'),
      },
    };
  }

  getData() {
    const categories = new CategoryList();

    return {
      categories: categories.getRawValue(),
      translations: this._prepareContextTranslations(),
    };
  }

  getDragDropId(target: HTMLElement) {
    return $(target).find('input').attr('value') ?? null;
  }

  clearDropTarget() {
    $(this.element).find('.item-list .item').removeClass('drop-target');
  }

  setDropTarget(target: HTMLElement) {
    $(target).addClass('drop-target');
  }

  _onDragStart(e: Event) {
    if (isElementEvent(e)) {
      this.draggedId = this.getDragDropId(e.target);
      this.setDropTarget(e.target);
    }
  }

  _onDragEnd() {
    this.clearDropTarget();
  }

  _onDragOver(e: Event) {
    if (isElementEvent(e)) {
      if (!this.draggedId) {
        return;
      }

      const targetId = this.getDragDropId(e.target);

      if (!targetId) {
        return;
      }

      this.clearDropTarget();
      this.setDropTarget(e.target);
    }
  }

  _onDrop(e: Event) {
    if (isElementEvent(e)) {
      const target = $(e.target).closest('.item')[0];
      const targetId = this.getDragDropId(target);
      this.clearDropTarget();

      const $source = $(this.element)
        .find(`input[value="${this.draggedId}"]`)
        .closest('.item');
      const $target = $(this.element)
        .find(`input[value="${targetId}"]`)
        .closest('.item');

      const placeholder = document.createElement('div');
      const parent = $source.parent();
      parent[0].insertBefore(placeholder, $source[0]);

      $target[0].before($source[0]);
      placeholder.before($target[0]);
      placeholder.remove();

      this.draggedId = null;
    }
  }

  async _updateObject(e: SubmitEvent, formData: { categories?: string[] }) {
    if (e.submitter instanceof HTMLInputElement && e?.submitter?.name !== 'submit') {
      return;
    }

    const selectedCategories = (formData.categories || []).filter(Boolean);

    if (selectedCategories.length === 0) {
      $M().notifications.sendMinimumCategoriesError();
      throw new Error();
    }

    $M().settings.set(SETTING_IDS.CATEGORIES, selectedCategories);
  }
}
