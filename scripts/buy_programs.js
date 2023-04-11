// @ts-ignore
import { buyPrograms, buyProg } from "/scripts/setup.js";
/** @param {import(".").NS } ns */
export async function main(ns) {
  ns.singularity.purchaseTor();
  buyPrograms(ns);
  buyProg(ns, "Autolink.exe");
  buyProg(ns, "DeepscanV2.exe");
  buyProg(ns, "ServerProfiler.exe");
  buyProg(ns, "DeepscanV1.exe");
}
