export class RandomManager {
  constructor(seed) {
    this.mt = new foundry.dice.MersenneTwister(seed);
  }

  getOne(totalOptions) {
    return Math.floor(this.mt.random() * totalOptions);
  }
}
