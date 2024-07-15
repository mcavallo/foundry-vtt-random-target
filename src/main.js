import { run } from './apps/RandomTarget.js';
import { MODULE } from './constants.js';
import { ChatManager } from './lib/ChatManager.js';
import { GameManager } from './lib/GameManager.js';
import { MacroMigration } from './lib/MacroMigration.js';
import { NotificationsManager } from './lib/NotificationsManager.js';
import { RandomManager } from './lib/RandomManager.js';
import { SettingsManager } from './lib/SettingsManager.js';

import './styles/module.scss';

Hooks.once('init', function () {
  const seed = Math.floor(Math.random() * 100000);

  const settingsManager = new SettingsManager();
  const gameManager = new GameManager();
  const chatManager = new ChatManager();
  const notificationsManager = new NotificationsManager();
  const randomManager = new RandomManager(seed);

  /**
   * Important: Avoid using object property shorthands as it can fail in some browsers.
   */
  window[MODULE.NAMESPACE] = {
    run: run,
    settings: settingsManager,
    chat: chatManager,
    game: gameManager,
    notifications: notificationsManager,
    random: randomManager,
  };
});

Hooks.once('ready', function () {
  const migration = new MacroMigration();
  migration.run();
});
