/** @param {import("..").NS } ns **/
export async function main(ns) {
  // hack.js [target] [delay] [sleep] [-l] [id]
  await ns.sleep(ns.args[1]);
  do {
    await ns.sleep(ns.args[2]);
    await ns.hack(ns.args[0], {stock: false});
  } while (ns.args[3] == "-l");
}
