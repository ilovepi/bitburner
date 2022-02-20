/** @param {NS} ns **/
export async function main(ns) {
    var threads = 1000;
    var servers = find_all_servers(ns).sort();
    var list = [];
    for (const s of servers) {
        list.push({ "name": s, "score": score_host(ns, s, threads, false) });
    }

    list.sort((a, b) => a.score - b.score);

    ns.tprint(list);
}


/** @param {NS} ns **/
function find_all_servers(ns) {
    var visited = [];
    var worklist = [];
    worklist.push(ns.getHostname())

    while (worklist.length != 0) {
        var target = worklist.pop(1);
        visited.push(target);
        var adjacent = ns.scan(target);
        for (const host of adjacent) {
            if (visited.includes(host)) {
                continue;
            } else {
                worklist.push(host);
            }
        }
    }
    return visited;
}

/** @param {NS} ns **/
function score_host(ns, hostname, threads, debug) {
    const grow_time = ns.getGrowTime(hostname);
    const weak_time = ns.getWeakenTime(hostname);
    const growth = ns.getServerGrowth(hostname);
    const min_sec = ns.getServerMinSecurityLevel(hostname);
    const max_money = ns.getServerMaxMoney(hostname);
    const money = ns.hackAnalyze(hostname) * threads * max_money;
    const hack_cost = ns.hackAnalyzeSecurity(threads);
    const hack_time = ns.getHackTime(hostname);
    const growth_time = grow_time * hack_cost / growth;
    const growth_cost = ns.growthAnalyzeSecurity(threads);
    const weaken_time = weak_time * (hack_cost + growth_cost) / (threads * .05);
    var period = hack_time + growth_time + weaken_time;
    var profitability = money / period;

    if (debug) {
        ns.tprintf("\nHost: %s", hostname);
        ns.tprintf("\tgrow time: %d", grow_time);
        ns.tprintf("\tweak time: %d", weak_time);
        ns.tprintf("\tgrowth: %d", growth);
        ns.tprintf("\tmin sec: %d", min_sec);
        ns.tprintf("\tmax $$$: $%d", max_money);
        ns.tprintf("\thack $$$: $%d", money);
        ns.tprintf("\thack cost: %d", hack_cost);
        ns.tprintf("\thack time: %d", hack_time);
        ns.tprintf("\tgrowth time: %d", growth_time);
        ns.tprintf("\tgrowth cost: %d", growth_cost);
        ns.tprintf("\tweaken time: %d", weaken_time);
        ns.tprintf("\tperiod: %d", period);
        ns.tprintf("\tprofitability: %d", profitability);
    }
    return profitability;
}