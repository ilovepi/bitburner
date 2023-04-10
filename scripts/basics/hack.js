// @ts-nocheck
/** @param {import("..").NS } ns **/
export async function main(ns) {
  // hack.js [target] [delay] [sleep] [-l] [id]
  let data = ns.flags([
    ["target", "n00dles"],
    ["delay", 0],
    ["sleep", 0],
    ["loop", false],
    ["stocks", false],
    ["id", 0],
  ]);
  await ns.sleep(data["delay"]);
    const hostname = data["target"];
  do {
    await ns.sleep(data["sleep"]);
    await ns.hack(hostname, { stock: data["stocks"] });
    // const money =
    //   ns.getServerMoneyAvailable(hostname);
    // ns.tprint(`${hostname}: $${money}`);
  } while (data["loop"]);
}
