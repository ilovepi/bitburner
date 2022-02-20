import { find_all_servers } from "/scripts/utils.js";

/** @param {NS} ns **/
export async function main(ns) {
    let data = [];
    let servers = await find_all_servers(ns);

    for (const s of servers) {
        data.push(analysis(ns, s, false));
        if (s == "home")
            continue;
        let files = ["/scripts/basics/grow.js", "/scripts/basics/weaken.js", "/scripts/basics/hack.js"];
        for (const f of files) {
            await ns.scp(f, s);
        }
    }
    data.sort((a, b) => b.score - a.score);
    let s = JSON.stringify(data, null, 1);
    await ns.write("/data/server.json.txt", s, "w");
}

/** @param {NS} ns **/
function analysis(ns, hostname, debug) {
    const hack_ratio = .1;

    // server stats
    const max_money = ns.getServerMaxMoney(hostname);
    const min_sec = ns.getServerMinSecurityLevel(hostname);
    const cur_money = ns.getServerMoneyAvailable(hostname);
    const cur_sec = ns.getServerSecurityLevel(hostname);


    //hack stats

    const hack_rate = ns.hackAnalyze(hostname);
    const hack_chance = ns.hackAnalyzeChance(hostname);
    //let t_h = ns.hackAnalyzeThreads(hostname, max_money * hack_ratio);
    const t_h = Math.ceil(hack_ratio / hack_rate);


    const hack_cost = ns.hackAnalyzeSecurity(t_h);
    const hack_time = ns.getHackTime(hostname);

    // grow stats
    const grow_time = ns.getGrowTime(hostname);
    const growth = ns.getServerGrowth(hostname);

    let ratio = max_money / (max_money - cur_money);
    if (max_money == 0 || cur_money == 0 || max_money == cur_money)
        ratio = 2;

    const t_g_i = Math.ceil(ns.growthAnalyze(hostname, ratio));
    const t_g = Math.ceil(ns.growthAnalyze(hostname, 1 / (1 - hack_ratio)));
    const sec_g_i = ns.growthAnalyzeSecurity(t_g_i);
    const sec_g = ns.growthAnalyzeSecurity(t_g);

    // weaken stats

    const weak_time = ns.getWeakenTime(hostname);
    const weaken_value = ns.weakenAnalyze(1);
    const t_w_i = Math.max(1, Math.ceil((cur_sec - min_sec) / weaken_value));
    const t_w_g_i = Math.ceil(sec_g_i / weaken_value);
    const t_w = Math.ceil((sec_g + hack_cost)/ weaken_value);

    const money = hack_rate * t_h * max_money;

    let stats = {
        "name": hostname,
        "is_rooted": ns.hasRootAccess(hostname),
        "ram": ns.getServerMaxRam(hostname),
        "can_hack": ns.getServerRequiredHackingLevel(hostname) < ns.getHackingLevel(),
        "max_money": max_money,
        "cur_money": cur_money,
        "target_money": money,
        "min_sec": min_sec,
        "cur_sec": cur_sec,
        "hack_rate": hack_rate,
        "hack_chance": hack_chance,
        "t_h": t_h,
        "hack_cost": hack_cost,
        "hack_time": hack_time,
        "growth": growth,
        "grow_time": grow_time,
        "t_g_i": t_g_i,
        "t_g": t_g,
        "sec_g_i": sec_g_i,
        "sec_g": sec_g,
        "weaken_val": weaken_value,
        "weaken_time": weak_time,
        "t_w_i": t_w_i,
        "t_w_g_i": t_w_g_i,
        "t_w": t_w,
    };

    if (debug) {
        let s = JSON.stringify(stats, null, 1);
        ns.tprint(s)
    }
    return stats;
}