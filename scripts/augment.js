/** @param {import(".").NS } ns */
export async function main(ns) {
  let price = 0;
  let money = 0;
  let aug_list = getAugmentationList(ns);

  aug_list.sort((a, b) => b.price - a.price);
  for (let aug of aug_list) {
    price = ns.singularity.getAugmentationPrice(aug.name);
    money = ns.getServerMoneyAvailable("home");
    if (price < money) {
      ns.singularity.purchaseAugmentation(aug.faction, aug.name);
    }
    await ns.sleep(1);
  }

  let did_buy;
  do {
    did_buy = false;
    let augs = ns.singularity.getAugmentationsFromFaction("CyberSec");
    for (let x of augs) {
      price = ns.singularity.getAugmentationPrice(x);
      money = ns.getServerMoneyAvailable("home");
      if (price < money) {
        did_buy = ns.singularity.purchaseAugmentation("CyberSec", x);
      }
    }
    await ns.sleep(1);
  } while (did_buy && price < money && money > 1000000);

  ns.singularity.installAugmentations("/scripts/setup.js");
}

/** @param {import(".").NS } ns */
export function getAugmentationList(ns) {
  let factions = ns.getPlayer().factions;
  let augs = [];
  for (let f of factions) {
    let aug_list = ns.singularity.getAugmentationsFromFaction(f);
    for (let a of aug_list) {
      if (!ns.singularity.getOwnedAugmentations(true).includes(a))
        augs.push(
          new Augmentation(
            f,
            a,
            ns.singularity.getAugmentationPrice(a),
            ns.singularity.getAugmentationPrereq(a),
            ns.singularity.getAugmentationRepReq(a)
          )
        );
    }
  }

  let s = JSON.stringify(augs, null, 1);
  ns.write("/data/augmentation_list.json.txt", s, "w");
  return augs;
}

class Augmentation {
  /**
   * @param {string} faction
   * @param {string} name
   * @param {number} price
   * @param {string[]} prereqs
   * @param {number} rep
   */
  constructor(faction, name, price, prereqs, rep) {
    this.faction = faction;
    this.name = name;
    this.price = price;
    this.prereqs = prereqs;
    this.reputation = rep;
  }
}
