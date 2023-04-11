const early = ["CyberSec", "Tian Di Hui", "Netburners"];
const city = ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum", "Volhaven"];
const hacking = ["NiteSec", "The Black Hand", "BitRunners"];
const corporations = [
  "ECorp",
  "MegaCorp",
  "KuaiGong International",
  "Four Sigma",
  "NWO",
  "Blade Industries",
  "OmniTek Incorporated",
  "Bachman & Associates",
  "Clarke Incorporated",
  "Fulcrum Secret Technologies",
];
const crime = ["Slum Snakes", "Tetrads", "Silhouette", "Speakers for the Dead", "The Dark Army", "The Syndicate"];
const endgame = ["The Covenant", "Daedalus", "Illuminati"];
const all_factions = [...early, ...city, ...hacking, ...corporations, ...crime, ...endgame];

/** @param {import(".").NS } ns */
export async function main(ns) {
  let player = ns.getPlayer();
  let my_factions = player.factions;

  for (let f of my_factions) {
    let aug_list = ns.singularity.getAugmentationsFromFaction(f);
    let augs = [];
    for (let a of aug_list) {
      if (!ns.singularity.getOwnedAugmentations(true).includes(a))
        augs.push({
          name: a,
          price: ns.singularity.getAugmentationPrice(a),
          prereq: ns.singularity.getAugmentationPrereq(a),
          rep: ns.singularity.getAugmentationRepReq(a),
        });
    }

    for (let a of augs) {
      let have_prereq = true;
      for (let p of a.prereq) {
        if (!ns.singularity.getOwnedAugmentations(true).includes(p)) {
          have_prereq = false;
          break;
        }
      }

      if (!have_prereq) {
        continue;
      }

      // work for faction until we have the necessary rep
      while (ns.singularity.getFactionRep(f) < a.rep) {
        ns.singularity.workForFaction(f, "hacking", true);
        await ns.sleep(1000 * 60);
      }
    }
  }
  ns.exec("/scripts/augment.js", "home");
}
