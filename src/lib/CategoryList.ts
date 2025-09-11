import type { Category, CategoryItem } from '#/types/module.ts';
import {
  CATEGORY_IDS,
  MIN_CATEGORY_TOKENS,
  MIN_SCENE_SELECTION_TOKENS,
  MODULE,
  SETTING_IDS,
} from '@/constants';
import {
  $M,
  formatActorTypeId,
  formatCategoryLabel,
  formatDispositionId,
  formatTabId,
  getDispositionName,
  sortNaturally,
} from './utils.ts';

export class CategoryList {
  private totalItems: number;
  private readonly categories: Category[];

  constructor() {
    const savedValues = $M().settings.get(SETTING_IDS.CATEGORIES);
    this.totalItems = 0;

    let categories: Category[] = [
      this.newCategoryEntry({
        id: CATEGORY_IDS.TARGETED,
        type: 'core',
        label:
          game?.i18n?.localize('RANDOMTARGET.Categories.Targets.Label') ?? 'Targets',
        description:
          game?.i18n?.localize('RANDOMTARGET.Categories.Targets.Description') ??
          'Lists the targeted tokens in the scene',
        info: `Only appears if there is at least ${MIN_SCENE_SELECTION_TOKENS} tokens targeted.`,
      }),
      this.newCategoryEntry({
        id: CATEGORY_IDS.SELECTED,
        type: 'core',
        label:
          game?.i18n?.localize('RANDOMTARGET.Categories.Selection.Label') ??
          'Selection',
        description:
          game?.i18n?.localize('RANDOMTARGET.Categories.Selection.Description') ??
          'Lists the selected tokens in the scene',
        info: `Only appears if there is at least ${MIN_SCENE_SELECTION_TOKENS} tokens selected.`,
      }),
      this.newCategoryEntry({
        id: CATEGORY_IDS.ALL,
        type: 'core',
        label: game?.i18n?.localize('RANDOMTARGET.Categories.All.Label') ?? 'All',
        description:
          game?.i18n?.localize('RANDOMTARGET.Categories.All.Description') ??
          'Lists all tokens in the scene',
      }),
    ];

    if (game.system?.documentTypes?.Actor) {
      Object.keys(game.system.documentTypes.Actor).forEach((key) => {
        const id = formatActorTypeId(key);

        if (id) {
          categories.push(
            this.newCategoryEntry({
              id,
              type: 'type',
              label: formatCategoryLabel(key),
              description:
                game?.i18n?.format('RANDOMTARGET.Categories.Type.Description', {
                  type: key,
                }) ?? `Lists tokens of type <code>${key}</code>`,
              info: `Only appears if there is at least ${MIN_CATEGORY_TOKENS} matching token.`,
            })
          );
        }
      });
    }

    for (const disposition of Object.values(CONST.TOKEN_DISPOSITIONS)) {
      const dispositionName = getDispositionName(disposition);
      const id = formatDispositionId(disposition);

      if (!dispositionName || !id) {
        console.warn(`[${MODULE.NAME}] Disposition "${disposition}" is not valid.`);
        continue;
      }

      categories.push(
        this.newCategoryEntry({
          id,
          type: 'disposition',
          label: formatCategoryLabel(dispositionName),
          description:
            game?.i18n?.format('RANDOMTARGET.Categories.Disposition.Description', {
              disposition: dispositionName,
            }) ?? `Lists tokens with disposition <code>${dispositionName}</code>`,
          info: `Only appears if there is at least ${MIN_CATEGORY_TOKENS} matching token.`,
        })
      );
    }

    this.categories = categories
      .map((category) => ({
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

        return sortNaturally(a.id, b.id);
      });
  }

  getRawValue() {
    return this.categories;
  }

  getSortedAndFiltered() {
    return this.categories.filter(
      (category) => category.totalItems > 0 && category.enabled
    );
  }

  getTotalItems() {
    return this.totalItems;
  }

  newCategoryEntry(
    attrs: Pick<Category, 'id' | 'type' | 'label' | 'description' | 'info'>
  ): Category {
    return {
      ...attrs,
      tabId: formatTabId(attrs.id),
      enabled: false,
      items: [],
      totalItems: 0,
    };
  }

  addItem(categoryId: string, item: CategoryItem) {
    const targetIndex = this.categories.findIndex(
      (category) => category.id === categoryId
    );

    if (targetIndex === -1) {
      console.error(`Category ${categoryId} doesn't exist.`);
      return false;
    }

    this.categories[targetIndex].items.push(item);
    this.categories[targetIndex].totalItems++;
    this.totalItems++;
  }
}
