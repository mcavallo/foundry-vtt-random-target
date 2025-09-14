import { t } from '@/lib/utils.ts';

export class NotificationsManager {
  constructor() {}

  sendTargetNotification(targetName: string) {
    ui?.notifications?.info(t('notifications.targeted', { targetName }), {
      console: false,
    });
  }

  sendMissingSceneError() {
    ui?.notifications?.error(t('notifications.missingSceneError'), {
      console: false,
    });
  }

  sendMinimumSelectionError() {
    ui?.notifications?.error(t('notifications.minimumSelectionError'), {
      console: false,
    });
  }

  sendMinimumCategoriesError() {
    ui?.notifications?.error(t('notifications.minimumCategoriesError'), {
      console: false,
    });
  }
}
