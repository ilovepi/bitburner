import { find_all_servers } from "/scripts/utils.js";

/** @param {import(".").NS } ns */
export async function main(ns) {
    let servers = await find_all_servers(ns);
    const home = "home";
    for (const s of servers) {
        let files = ns.ls(s, ".lit");
        for (const f of files) {
            ns.tprintf("%s: %s", s, f);
            if (!ns.fileExists(f, home))
                ns.scp(f,  home, s);
        }
    }
}
