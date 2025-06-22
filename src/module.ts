import { run } from '@/apps/TargetApp';
import { ChatManager } from '@/lib/ChatManager';
import { GameManager } from '@/lib/GameManager';
import { MacroMigration } from '@/lib/MacroMigration';
import { NotificationsManager } from '@/lib/NotificationsManager';
import { RandomManager } from '@/lib/RandomManager';
import { SettingsManager } from '@/lib/SettingsManager';

import './module.scss';

Hooks.once('init', function () {
  const seed = Math.floor(Math.random() * 100000);

  const settingsManager = new SettingsManager();
  const gameManager = new GameManager();
  const chatManager = new ChatManager();
  const notificationsManager = new NotificationsManager();
  const randomManager = new RandomManager(seed);

  window.randomTarget = {
    run,
    settings: settingsManager,
    chat: chatManager,
    game: gameManager,
    notifications: notificationsManager,
    random: randomManager,
  };
});

Hooks.once('ready', function () {
  const migration = new MacroMigration();
  void migration.run();
});
