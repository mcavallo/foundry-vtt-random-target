import { MODULE, SUPPORT_URL } from '@/constants';

export default class SupportDialog extends foundry.applications.api.DialogV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE.ID}-support-dialog`,
    position: {
      width: 450,
      height: 'auto' as foundry.applications.api.ApplicationV2.Position['height'],
    },
    window: { title: 'Support this module' },
    content: `
      <div class="dialog-heading">Thank you for using <strong>Random Target</strong>!</div>
      <div class="dialog-text">This project has been actively maintained since 2022. What began as a small side project has grown into a tool now used by hundreds of Foundry VTT users just like you.</div>
      <div class="dialog-gif"><img src="https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3N2YzZWJqOGl0c2VsM2k0cGx3NjQ0Z2c0ZXdwM2k5em1vcnMyaXRjcSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/a3IWyhkEC0p32/giphy.gif"/></div>
      <div class="dialog-text">If you find this module useful, please consider supporting its ongoing development!</div>
      `,
    buttons: [
      {
        action: 'later',
        label: 'Maybe later',
        // @ts-expect-error fix types later
        callback: (_event, _button, dialog: SupportDialog) => {
          void dialog.close();
        },
      },
      {
        action: 'support',
        label: 'Support now',
        icon: 'fas fa-heart',
        // @ts-expect-error fix types later
        callback: (_event, _button, dialog: SupportDialog) => {
          window.open(SUPPORT_URL, '_blank');
          void dialog.close();
        },
      },
    ],
  };
}
