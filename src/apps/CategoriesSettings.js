import { MODULE, SETTING_IDS } from '../constants.js';
import { CategoryList } from '../lib/CategoryList.js';

export class CategoriesSettings extends FormApplication {
  #dragEndHandler;

  constructor() {
    super();
    this.draggedId = null;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form', MODULE.ID],
      popOut: true,
      id: `${MODULE.ID}-categories-setting`,
      title: `${MODULE.NAME}: Categories`,
      template: `modules/${MODULE.ID}/templates/categories-setting.hbs`,
      dragDrop: [{ dragSelector: '.item-list .item', dropSelector: '.item-list .item' }],
      width: 400,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    this.#dragEndHandler ||= this._onDragEnd.bind(this);
    document.addEventListener('dragend', this.#dragEndHandler);
  }

  async close(options) {
    document.removeEventListener('keydown', this.#dragEndHandler);
    return super.close(options);
  }

  getData() {
    const categories = new CategoryList();

    return {
      categories: categories.getRawValue(),
    };
  }

  getDragDropId(target) {
    return $(target).find('input').attr('value');
  }

  clearDropTarget() {
    $(this.element).find('.item-list .item').removeClass('drop-target');
  }

  setDropTarget(target) {
    $(target).addClass('drop-target');
  }

  _onDragStart(event) {
    this.draggedId = this.getDragDropId(event.target);
    this.setDropTarget(event.target);
  }

  _onDragEnd() {
    this.clearDropTarget();
  }

  _onDragOver(event) {
    if (!this.draggedId) {
      return;
    }

    const targetId = this.getDragDropId(event.target);

    if (!targetId) {
      return;
    }

    this.clearDropTarget();
    this.setDropTarget(event.target);
  }

  _onDrop(event) {
    const target = $(event.target).closest('.item')[0];
    const targetId = this.getDragDropId(target);
    this.clearDropTarget();

    const $source = $(this.element).find(`input[value="${this.draggedId}"]`).closest('.item');
    const $target = $(this.element).find(`input[value="${targetId}"]`).closest('.item');

    const placeholder = document.createElement('div');
    const parent = $source.parent();
    parent[0].insertBefore(placeholder, $source[0]);

    $target[0].before($source[0]);
    placeholder.before($target[0]);
    placeholder.remove();

    this.draggedId = null;
  }

  async _updateObject(event, formData) {
    if (event.submitter.name !== 'submit') {
      return;
    }

    const selectedCategories = (formData.categories || []).filter(Boolean);

    if (selectedCategories.length === 0) {
      ui.notifications.error('You need to select at least 1 category', { console: false });
      throw new Error();
    }

    window[MODULE.NAMESPACE].saveSetting(SETTING_IDS.CATEGORIES, selectedCategories);
  }
}
