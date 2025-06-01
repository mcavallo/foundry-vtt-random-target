import { MODULE } from '../constants.js';

export class MacroMigration {
  constructor() {
    this.compendiumId = `${MODULE.ID}.${MODULE.MACRO_COMPENDIUM}`;
    this.macroSourceId = `Compendium.${this.compendiumId}.Macro.${MODULE.MACRO_ID}`;
  }

  _getGameMacros() {
    return Array.from(game.macros).filter(
      macro => macro._source?.flags?.core?.sourceId === this.macroSourceId
    );
  }

  async _getLatestCompendiumVersionCommand() {
    const compendiumMacros = await game.packs.get(this.compendiumId).getDocuments();
    const latestMacro = compendiumMacros.find(
      macro => macro._id === MODULE.MACRO_ID
    );

    if (!latestMacro) {
      return null;
    }

    return latestMacro.command;
  }

  async run() {
    const gameMacros = this._getGameMacros();

    if (gameMacros.length === 0) {
      return;
    }

    const latestCommand = await this._getLatestCompendiumVersionCommand();

    if (!latestCommand) {
      return;
    }

    gameMacros.forEach(macro => {
      macro.command = latestCommand;
    });
  }
}
