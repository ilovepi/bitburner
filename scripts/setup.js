/** @param {import(".").NS } ns */
export async function main(ns) {
  ns.purchaseTor();
  buyPrograms(ns);
  ns.universityCourse("rothman university", "study computer science", true);
  ns.exec("/scripts/daemon.js", "home");

  await ns.sleep(1000 * 5 * 60);
  buyPrograms(ns);
  ns.exec("/scripts/work.js", "home");
  ns.exec("/scripts/backdoor.js", "home");
  for (let f of ns.checkFactionInvitations()) {
    ns.joinFaction(f);
  }
}

// try to open every port we can
/** @param {import(".").NS } ns */
export function buyPrograms(ns) {
  buyProg(ns, "BruteSSH.exe");
  buyProg(ns, "FTPCrack.exe");
  buyProg(ns, "relaySMTP.exe");
  buyProg(ns, "HTTPWorm.exe");
  buyProg(ns, "SQLInject.exe");
  buyProg(ns, "Formulas.exe");
}

/** @param {import(".").NS } ns */
function buyProg(ns, name) {
  if (!ns.fileExists(name, "home")) ns.purchaseProgram(name);
}
