class Server {
    constructor(name, rooted, can_hack, ram, t_h, t_g, t_w, score) {
        this.name = name;
        this.is_rooted = rooted;
        this.can_hack = can_hack;
        this.ram = ram;
        this.t_h = t_h;
        this.t_g = t_g;
        this.t_w = t_w;
        this.score = score;
    }

}


/** @param {NS} ns **/
export async function main(ns) {
    var servers = JSON.parse(ns.read("server.json"));
    var ram = 0;
    var max = servers[0];
    for (const a of servers) {
        if (!a.can_hack)
            continue;
        ram += a.ram;
        if (a.score > max.score) {
            max = a;
        }
    }
    var total_threads = Math.floor(ram / 1.7);
    ns.tprintf("Total Ram = %d", ram);
    ns.tprintf("Total threads = %d", total_threads);

    //var data =  await get_data(ns, servers, total_threads)

    //var s = JSON.stringify(data, null, 1);
    //await ns.write("attack.json", s, "w");

}

/** @param {NS} ns **/
async function get_data(ns, servers, total_threads) {
    var data = [];
    for (const host of servers) {
        if (!host.can_hack)
            continue;
        var res = [];
        var s = host.name
        for (let hacking_threads = 1; hacking_threads < total_threads - 1; hacking_threads++) {
            for (let grow_threads = 1; grow_threads < total_threads - hacking_threads; grow_threads++) {
                var weak_threads = total_threads - grow_threads - hacking_threads;
                if (weak_threads < 1)
                    continue;
                res.push({ "hack": hacking_threads, "grow": grow_threads, "weak": weak_threads, "score": analysis(ns, s, hacking_threads, grow_threads, weak_threads, false) });
            }
        }
        if (res.length == 0) {
            ns.tprint(s);
            ns.tprint(total_threads);
        }
        res.sort((a, b) => b.score - a.score);
        data.push(new Server(s, can_root(ns, s), can_hack(ns, s), ns.getServerMaxRam(s), res[0].hack, res[0].grow, res[0].weak, res[0].score));
        await ns.sleep(1);
    }

    data.sort((a, b) => b.score - a.score);
    return data;
}



function analysis(ns, hostname, hacking_threads, grow_threads, weaken_threads, debug) {
    const grow_time = ns.getGrowTime(hostname);
    const weak_time = ns.getWeakenTime(hostname);
    const growth = ns.getServerGrowth(hostname);
    const min_sec = ns.getServerMinSecurityLevel(hostname);
    const max_money = ns.getServerMaxMoney(hostname);
    const money = ns.hackAnalyze(hostname) * hacking_threads * max_money;
    const hack_cost = ns.hackAnalyzeSecurity(hacking_threads);
    const hack_time = ns.getHackTime(hostname);
    const growth_time = grow_time * hack_cost / growth;
    const growth_cost = ns.growthAnalyzeSecurity(grow_threads);
    const weaken_time = weak_time * (hack_cost + growth_cost) / (weaken_threads * .05);
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
        ns.tprintf("\thack cost: %f", hack_cost);
        ns.tprintf("\thack time: %d", hack_time);
        ns.tprintf("\tgrowth time: %d", growth_time);
        ns.tprintf("\tgrowth cost: %f", growth_cost);
        ns.tprintf("\tweaken time: %d", weaken_time);
        ns.tprintf("\tperiod: %d", period);
        ns.tprintf("\tprofitability: %d", profitability);
    }
    return profitability;
}



/** @param {NS} ns **/
function can_hack(ns, target) {
    const sec = ns.getServerMinSecurityLevel(target);
    const ports = ns.getServerNumPortsRequired(target);
    const hack_level = ns.getServerRequiredHackingLevel(target);
    const hacking_ability = ns.getHackingLevel();

    return sec < hacking_ability && hack_level < hacking_ability && ports <= port_count(ns);
}


/** @param {NS} ns **/
function can_root(ns, target) {
    const sec = ns.getServerMinSecurityLevel(target);
    const hacking_ability = ns.getHackingLevel();
    return sec < hacking_ability;
}

function port_count(ns) {
    const home = "home";
    var count = 0;
    if (ns.fileExists("BruteSSH.exe", home))
        count++;
    if (ns.fileExists("FTPCrack.exe", home))
        count++;
    if (ns.fileExists("relaySMTP.exe", home))
        count++;
    if (ns.fileExists("HTTPWorm.exe", home))
        count++;
    if (ns.fileExists("SQLInject.exe", home))
        count++;
    return count;
}