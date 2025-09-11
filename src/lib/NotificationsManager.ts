export class NotificationsManager {
  constructor() {}

  sendTargetNotification(targetName: string) {
    ui?.notifications?.info(
      game?.i18n?.format('RANDOMTARGET.Targeted', {
        targetName: `<b>${targetName}</b>`,
      }) ?? `<b>${targetName}</b> targeted`,
      { console: false }
    );
  }

  sendMissingSceneError() {
    ui?.notifications?.error(
      game?.i18n?.localize('RANDOMTARGET.MissingSceneError') ??
        'You need to have an active scene to select random targets',
      { console: false }
    );
  }

  sendMinimumSelectionError() {
    ui?.notifications?.error(
      game?.i18n?.localize('RANDOMTARGET.MinimumSelectionError') ??
        'You need to select at least 2 tokens',
      { console: false }
    );
  }

  sendMinimumCategoriesError() {
    ui?.notifications?.error(
      game?.i18n?.localize('RANDOMTARGET.MinimumCategoriesError') ??
        'You need to select at least 1 category',
      { console: false }
    );
  }
}
