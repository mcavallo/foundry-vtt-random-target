import { run } from '@/apps/TargetApp';
import { ChatManager } from '@/lib/ChatManager';
import { GameManager } from '@/lib/GameManager';
import { MacroMigration } from '@/lib/MacroMigration';
import { NotificationsManager } from '@/lib/NotificationsManager';
import { RandomManager } from '@/lib/RandomManager';
import { SettingsManager } from '@/lib/SettingsManager';

import './module.scss';

Hooks.once('init', () => {
  const seed = Math.floor(Math.random() * 100000);

  const settings = new SettingsManager();
  const game = new GameManager();
  const chat = new ChatManager();
  const notifications = new NotificationsManager();
  const random = new RandomManager(seed);

  window.randomTarget = {
    run,
    settings,
    chat,
    game,
    notifications,
    random,
  };
});

Hooks.once('ready', () => {
  const migration = new MacroMigration();
  void migration.run();
});
