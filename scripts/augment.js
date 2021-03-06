import { find_all_servers } from "/scripts/utils.js";

/** @param {import(".").NS } ns */
export async function main(ns) {
  let price = 0;
  let money = 0;
  do {
    let augs = ns.getAugmentationsFromFaction("CSEC");
    for (let x of augs) {
      price = ns.getAugmentationPrice(x);
      money = ns.getServerMoneyAvailable("home");
      if (price < money) {
        ns.purchaseAugmentation("CSEC", s);
      }
    }
  } while (price < money && money > 1000000);
}
