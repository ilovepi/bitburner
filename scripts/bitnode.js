/** @param {import(".").NS } ns */
export async function main(ns) {
  while (ns.getHackingLevel() < 9000) {
    await ns.sleep(60 * 1000);
  }

  ns.exec("/scripts/backdoor.js", "home");
}
