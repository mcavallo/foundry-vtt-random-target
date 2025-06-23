import { MODULE } from '@/constants';

export class MacroMigration {
  private compendiumId: string;
  private macroSourceId: string;

  constructor() {
    this.compendiumId = `${MODULE.ID}.${MODULE.MACRO_COMPENDIUM}`;
    this.macroSourceId = `Compendium.${this.compendiumId}.Macro.${MODULE.MACRO_ID}`;
  }

  _getGameMacros() {
    // @ts-expect-error fix types here
    const macros = Array.from(game.macros);

    return (macros as Macro[]).filter(
      (macro) => macro._stats.compendiumSource === this.macroSourceId
    );
  }

  async _getLatestCompendiumVersionCommand(): Promise<string | null> {
    if (!game || !game.packs) {
      return null;
    }

    const pack = game.packs.get(this.compendiumId);
    const compendiumMacros = (await pack?.getDocuments()) ?? [];
    const latestMacro = compendiumMacros.find(
      (macro) => macro._id === MODULE.MACRO_ID
    );

    // @ts-expect-error fix types here
    return latestMacro ? latestMacro.command : null;
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

    gameMacros.forEach((macro) => {
      macro.command = latestCommand;
    });
  }
}
