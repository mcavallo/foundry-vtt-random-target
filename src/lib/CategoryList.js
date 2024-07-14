import { CATEGORY_IDS, MODULE, SETTING_IDS } from '../constants.js';
import { getDispositionName, sortAlphabetically } from '../utils.js';

export class CategoryList {
  static formatTypeId(raw) {
    if (!raw) {
      return;
    }

    const normalizedKey = raw.toLowerCase();
    return `type.${normalizedKey}`;
  }

  static formatDispositionId(raw) {
    const disposition = getDispositionName(raw);
    return `disposition.${disposition}`;
  }

  static formatCategoryName(str) {
    const lower = str.toLowerCase();

    if (['npc', 'pc'].includes(lower)) {
      return lower.toUpperCase();
    }

    return lower.replace(/\b\w/g, s => s.toUpperCase());
  }

  constructor() {
    const savedValues = window[MODULE.NAMESPACE].settings[SETTING_IDS.CATEGORIES];
    this.totalItems = 0;

    let categories = [
      this.newCategoryEntry({
        id: CATEGORY_IDS.TARGETED,
        type: 'core',
        label: 'Targeted',
        description: 'Lists the targeted tokens in the scene',
        info: 'Only appears if there is at least 2 tokens targeted.',
      }),
      this.newCategoryEntry({
        id: CATEGORY_IDS.SELECTED,
        type: 'core',
        label: 'Selected',
        description: 'Lists the selected tokens in the scene',
        info: 'Only appears if there is at least 2 tokens selected.',
      }),
      this.newCategoryEntry({
        id: CATEGORY_IDS.ALL,
        type: 'core',
        label: 'All',
        description: 'Lists all tokens in the scene',
      }),
    ];

    if (game.system.documentTypes && game.system.documentTypes.Actor) {
      Object.keys(game.system.documentTypes.Actor).forEach(key => {
        categories.push(
          this.newCategoryEntry({
            id: CategoryList.formatTypeId(key),
            type: 'type',
            label: CategoryList.formatCategoryName(key),
            description: `Lists tokens of type <code>${key}</code>`,
            info: 'Only appears if there is at least 1 matching token.',
          })
        );
      });
    }

    Object.values(CONST.TOKEN_DISPOSITIONS).forEach(key => {
      const dispositionName = getDispositionName(key);

      categories.push(
        this.newCategoryEntry({
          id: CategoryList.formatDispositionId(key),
          type: 'disposition',
          label: CategoryList.formatCategoryName(dispositionName),
          description: `Lists tokens with disposition <code>${dispositionName}</code>`,
          info: 'Only appears if there is at least 1 matching token.',
        })
      );
    });

    this.categories = categories
      .map(category => ({
        ...category,
        enabled: savedValues.includes(category.id),
      }))
      .sort((a, b) => {
        const aIndex = savedValues.indexOf(a.id);
        const bIndex = savedValues.indexOf(b.id);

        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }

        if (aIndex !== -1) {
          return -1;
        }

        if (bIndex !== -1) {
          return 1;
        }

        return sortAlphabetically(a.id, b.id);
      });
  }

  getRawValue() {
    return this.categories;
  }

  getSortedAndFiltered() {
    return this.categories.filter(category => category.totalItems > 0 && category.enabled);
  }

  getTotalItems() {
    return this.totalItems;
  }

  newCategoryEntry(attrs) {
    return {
      ...attrs,
      enabled: false,
      items: [],
      totalItems: 0,
    };
  }

  addItem(categoryId, token) {
    const targetIndex = this.categories.findIndex(category => category.id === categoryId);

    if (targetIndex === -1) {
      console.error(`Category ${categoryId} doesn't exist.`);
      return false;
    }

    this.categories[targetIndex].items.push(token);
    this.categories[targetIndex].totalItems++;
    this.totalItems++;
  }
}
