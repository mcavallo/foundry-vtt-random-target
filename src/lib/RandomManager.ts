export class RandomManager {
  protected mt: foundry.dice.MersenneTwister;

  constructor(seed: number) {
    this.mt = new foundry.dice.MersenneTwister(seed);
  }

  getOne(totalOptions: number) {
    return Math.floor(this.mt.random() * totalOptions);
  }

  pickFromPool({
    pool,
    previousTarget,
    avoidSelectingSameTarget,
  }: {
    pool: string[];
    previousTarget: string;
    avoidSelectingSameTarget: boolean;
  }) {
    let randomPick;

    while (
      !randomPick ||
      (avoidSelectingSameTarget && randomPick === previousTarget)
    ) {
      const idx = this.getOne(pool.length);
      randomPick = pool[idx];
    }

    return randomPick;
  }
}
