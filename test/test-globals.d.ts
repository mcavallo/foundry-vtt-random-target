import 'fvtt-types/src/foundry';

export {};

declare global {
  var game: Game;
  var foundry: { utils: foundry.utils };
}
