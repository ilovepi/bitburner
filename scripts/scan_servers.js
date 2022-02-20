import { find_all_servers, can_root, can_hack } from "/scripts/utils.js";


/** @param {NS} ns **/
export async function main(ns) {
    let servers = await find_all_servers(ns);
    let rooted = await servers.filter(a => ns.hasRootAccess(a));
    let rootable = await servers.filter(a => !ns.hasRootAccess(a) && can_root(ns, a));
    ns.tprint(rootable);
    for (s of rootable) {
        ns.nuke(s);
    }
    let targets = servers.filter(a => ns.getHackingLevel() > ns.getServerRequiredHackingLevel(a) && ns.getServerMaxMoney(a) > 10000000);
    targets = targets.map(function (a) { return { "name": a, "max_money": ns.getServerMaxMoney(a), "cur_money": ns.getServerMoneyAvailable(a), "grow": ns.getServerGrowth(a), "hacking_level": ns.getServerRequiredHackingLevel(a) }; });
    targets.sort((a, b) => a.hacking_level - b.hacking_level);
    var s = JSON.stringify(targets, null, 1);
    await ns.write("attack.json", s, "w");
    ns.tprint(s);

    let r = targets.reverse();
    for (let i = 0; i < Math.min(25, targets.length); i++) {
        ns.exec("/scripts/distribute_exploit.js", "home", 1, "s" + i, r[i].name);
    }
}