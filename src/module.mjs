import { run } from './apps/random-target.js';

Hooks.once('init', function () {
  game.randomTarget = {
    run: run,
  };
});
