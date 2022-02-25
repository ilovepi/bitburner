/** @param {NS} ns **/
export async function main(ns) {
  // grow.js [target] [delay] [sleep] [-l] [id]
  await ns.sleep(ns.args[1]);
  do {
    await ns.sleep(ns.args[2]);
    await ns.grow(ns.args[0]);
  } while (ns.args[3] == "-l");
}
