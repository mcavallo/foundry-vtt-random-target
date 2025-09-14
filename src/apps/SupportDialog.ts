import { MODULE, SUPPORT_URL } from '@/constants';
import { t } from '@/lib/utils.ts';
// @ts-expect-error this import has issues but the types are working fine
import type ApplicationV2 from 'fvtt-types/src/foundry/client/applications/api/application';

export default class SupportDialog extends foundry.applications.api.DialogV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE.ID}-support-dialog`,
    position: {
      width: 450,
      height: 'auto' as foundry.applications.api.ApplicationV2.Position['height'],
    },
  };

  /**
   * Initializes the application during instantiation.
   */
  _initializeApplicationOptions(options: ApplicationV2.Configuration) {
    const newOptions = foundry.utils.mergeObject(options, {
      window: {
        title: t('supportDialog.window.title'),
      },
      buttons: [
        {
          action: 'later',
          label: t('supportDialog.ui.buttons.later.label'),
          // @ts-expect-error fix types later
          callback: (_event, _button, dialog: SupportDialog) => {
            void dialog.close();
          },
        },
        {
          action: 'support',
          label: t('supportDialog.ui.buttons.support.label'),
          icon: 'fas fa-heart',
          // @ts-expect-error fix types later
          callback: (_event, _button, dialog: SupportDialog) => {
            window.open(SUPPORT_URL, '_blank');
            void dialog.close();
          },
        },
      ],
      content: `
        <div class="dialog-heading">${t('supportDialog.content.heading')}</div>
        <div class="dialog-text">${t('supportDialog.content.backgroundText')}</div>
        <div class="dialog-gif"><img src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2YzZWJqOGl0c2VsM2k0cGx3NjQ0Z2c0ZXdwM2k5em1vcnMyaXRjcSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/a3IWyhkEC0p32/giphy.gif"/></div>
        <div class="dialog-text">${t('supportDialog.content.supportText')}</div>
      `,
    });

    return super._initializeApplicationOptions(newOptions);
  }
}
