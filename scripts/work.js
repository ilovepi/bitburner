import { find_all_servers } from "/scripts/utils.js";
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
const all_factions = [].concat(early, city, hacking, corporations, crime, endgame);
/** @param {import(".").NS } ns */
export async function main(ns) {
  let player = ns.getPlayer();
  for (let c of corporations) {
    if (!player.factions.includes(c) && ns.singularity.getCompanyRep(c) < 250000) {
      if (player.jobs[c] != undefined || ns.singularity.applyToCompany(c, "software")) {
        while (ns.singularity.getCompanyRep(c) < 250000) {
          ns.singularity.workForCompany(c, false);
          await ns.sleep(60 * 1000);
        }
      }
    }
  }
  ns.exec("/scripts/backdoor.js", "home");
  ns.exec("/scripts/faction.js", "home");
}
