export class RandomManager {
  constructor(seed) {
    this.mt = new foundry.dice.MersenneTwister(seed);
  }

  getOne(totalOptions) {
    return Math.floor(this.mt.random() * totalOptions);
  }

  pickFromPool({ pool, previousTarget, avoidSelectingSameTarget }) {
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
