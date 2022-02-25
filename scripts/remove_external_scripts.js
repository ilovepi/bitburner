import { find_all_servers } from "/scripts/utils.js";
/**  @param {import(".").NS } ns **/
export async function main(ns) {
  let servers = await find_all_servers(ns);
  for (let s of servers) {
    if (s == "home") continue;
    ns.rm("/script/basics/hack.js", s);
    ns.rm("/script/basics/grow.js", s);
    ns.rm("/script/basics/weaken.js", s);
  }
}
