import { find_all_servers } from "/scripts/utils.js";

const crime = ["Slum Snakes", "Tetrads", "Silhouette", "Speakers for the Dead", "The Dark Army", "The Syndicate"];
const max_iterations = 50;

/** @param {import(".").NS } ns */
export async function main(ns) {
  for (let i = 0; i < max_iterations; ++i) {
    // ns.travelToCity("chongching");
    //await ns.sleep(ns.commitCrime("Mug someone"));
    await ns.sleep(ns.commitCrime("Homicide"));
  }
}
