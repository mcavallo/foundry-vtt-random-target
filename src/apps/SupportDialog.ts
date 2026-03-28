import { MODULE, SUPPORT_GIF_URL, SUPPORT_URL } from '@/constants';
import { t } from '@/lib/utils.ts';
import ApplicationV2 = foundry.applications.api.ApplicationV2;
import DialogV2 = foundry.applications.api.DialogV2;

export default class SupportDialog extends foundry.applications.api.DialogV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE.ID}-support-dialog`,
    position: {
      width: 450,
      height: 'auto' as const,
    },
  };

  /**
   * Initializes the application during instantiation.
   */
  _initializeApplicationOptions(options: ApplicationV2.Configuration) {
    const buttons: DialogV2.Button[] = [
      {
        action: 'later',
        label: t('supportDialog.ui.buttons.later.label'),
        callback: (_event, _button, dialog) => {
          void dialog.close();
        },
      },
      {
        action: 'support',
        label: t('supportDialog.ui.buttons.support.label'),
        icon: 'fas fa-heart',
        callback: (_event, _button, dialog) => {
          window.open(SUPPORT_URL, '_blank');
          void dialog.close();
        },
      },
    ];

    const newOptions = foundry.utils.mergeObject(options, {
      window: {
        title: t('supportDialog.window.title'),
      },
      buttons,
      content: `
        <div class="dialog-heading">${t('supportDialog.content.heading')}</div>
        <div class="dialog-text">${t('supportDialog.content.backgroundText')}</div>
        <div class="dialog-gif"><img alt="" src="${SUPPORT_GIF_URL}"/></div>
        <div class="dialog-text">${t('supportDialog.content.supportText')}</div>
      `,
    });

    return super._initializeApplicationOptions(newOptions);
  }
}
