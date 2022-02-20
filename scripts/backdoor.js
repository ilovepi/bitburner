import { find_all_servers } from "/scripts/utils.js";

/** @param {NS} ns **/
export async function main(ns) {
    let servers = await find_all_servers(ns);
    for(let s of servers)
    {
        ns.installBackdoor(s);

    }


    

}