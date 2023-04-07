import { find_all_servers } from "/scripts/utils.js";

/** @param {import(".").NS } ns */
export async function main(ns) {
  var p = { completely_unused_field: true };
  ns.bypass(p);
  p.completely_unused_field = true;
 await ns.sleep(50);

  ns.
}