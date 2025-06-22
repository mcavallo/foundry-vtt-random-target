export class NotificationsManager {
  constructor() {}

  sendTargetNotification(targetName: string) {
    ui?.notifications?.info(`<b>${targetName}</b> targeted`, { console: false });
  }

  sendMissingSceneError() {
    ui?.notifications?.error(
      'You need to have an active scene to select random targets',
      { console: false }
    );
  }

  sendMinimumSelectionError() {
    ui?.notifications?.error('You need to select at least 2 tokens', {
      console: false,
    });
  }

  sendMinimumCategoriesError() {
    ui?.notifications?.error('You need to select at least 1 category', {
      console: false,
    });
  }
}
