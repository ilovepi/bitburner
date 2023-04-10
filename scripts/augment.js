/** @param {import(".").NS } ns */
export async function main(ns) {
  let price = 0;
  let money = 0;
  do {
    let augs = ns.singularity.getAugmentationsFromFaction("CyberSec");
    for (let x of augs) {
      price = ns.singularity.getAugmentationPrice(x);
      money = ns.getServerMoneyAvailable("home");
      if (price < money) {
        ns.singularity.purchaseAugmentation("CyperSec", x);
      }
    }
  } while (price < money && money > 1000000);
}
