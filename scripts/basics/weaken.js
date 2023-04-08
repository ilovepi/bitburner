/** @param {import("..").NS } ns **/
export async function main(ns) {
  // weaken.js [target] [delay] [sleep] [-l] [id]
  let data = ns.flags([
    ["target", "n00dles"],
    ["delay", 0],
    ["sleep", 0],
    ["loop", false],
    ["stocks", false],
    ["id", 0],
  ]);
  await ns.sleep(data["delay"]);
  do {
    await ns.sleep(data["sleep"]);
    await ns.weaken(data["target"], {stock: data["stocks"]});
  } while (data["loop"]);
}
