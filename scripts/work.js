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
  "Fulcrum Technologies",
];
const crime = ["Slum Snakes", "Tetrads", "Silhouette", "Speakers for the Dead", "The Dark Army", "The Syndicate"];
const endgame = ["The Covenant", "Daedalus", "Illuminati"];
const all_factions = [...early, ...city, ...hacking, ...corporations, ...crime, ...endgame];

/** @param {import(".").NS } ns */
export async function main(ns) {
  const required_rep = 400_000;
  let player = ns.getPlayer();
  for (let c of corporations) {
    if (!player.factions.includes(c) && ns.singularity.getCompanyRep(c) < required_rep) {
      if (ns.singularity.applyToCompany(c, "software") || player.jobs[c] != undefined) {
        while (ns.singularity.getCompanyRep(c) < required_rep) {
          ns.singularity.workForCompany(c, true);
          await ns.sleep(60 * 1000);
        }
      }
    }
  }
  for (let f of ns.singularity.checkFactionInvitations()) {
    ns.singularity.joinFaction(f);
  }
  ns.exec("/scripts/backdoor.js", "home");
  ns.exec("/scripts/faction.js", "home");
}
