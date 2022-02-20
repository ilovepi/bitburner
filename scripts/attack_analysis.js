/** @param {NS} ns **/
export async function main(ns) {
    if (ns.args.length < 1) {
        ns.tprint("Missing target");
        return;
    }

    var dryrun = false;
    if (ns.args.length == 2) {
        dryrun = true;
    }

    const hostname = ns.getHostname();
    const target = ns.args[0];
    const host_ram = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
    var total_threads = Math.floor(host_ram / 1.75);

    log(ns, "Running Attack Analysis");
    log(ns, "Host: %s", hostname);
    log(ns, "Ram Available: %d GB", host_ram);
    log(ns, "Total Threads: %d", total_threads);

    var res = analysis(ns, target, total_threads, true);

    ns.tprintf("Batches: %d, T_h: %d, T_g: %d, T_w: %d S_h: %d, S_g: %d, Hack Time: %d, Grow Time: %d, Weaken Time: %d, Period: %d",
        res.batches, res.t_h, res.t_g, res.t_w, res.s_h, res.s_g, res.hack_time, res.grow_time, res.weak_time, res.period);

    let max_batches = (total_threads / 3);
    ns.tprintf("max batches = %d", max_batches);

let batches = res.batches;
    //let batches = Math.min(60, res.batches, max_batches);
    let period = res.hack_time / batches;
    ns.tprintf("period = %d", period);

    if (dryrun)
        return;

    var moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    var securityThresh = ns.getServerMinSecurityLevel(target) + 5;

    let threads = 1;
    //	breakPorts(ns, target);
    //	ns.nuke(target);
    while (false) {
        if (ns.getServerSecurityLevel(target) > securityThresh) {
            await ns.weaken(target);
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
            await ns.grow(target);
        } else {
            await ns.hack(target);
        }
    }


    let first = false;
    if (!dryrun) {
        for (let i = 0; i < batches; i++) {
            //log(ns, "Executing Batch %d", i);
            if (ns.exec("/scripts/basics/weaken.js", hostname, res.t_w, target, 5, i) == 0) {
                log(ns, "weaken.js failed");
                return;
            }
            if (ns.exec("/scripts/basics/grow.js", hostname, res.t_g, target, res.s_g + 5, i) == 0) {
                log(ns, "grow.js failed");
                return;
            }
            if (first) {
                await ns.sleep(res.grow_time);
                first = false;
            }
            if (ns.exec("/scripts/basics/hack.js", hostname, res.t_h, target, res.s_h + 5, i) == 0) {
                log(ns, "hack.js failed");
                return;
            }
            await ns.sleep(period);
        }
    }
}


/** @param {NS} ns **/
function analysis(ns, hostname, total_threads, debug) {



    const grow_time = ns.getGrowTime(hostname);
    const weak_time = ns.getWeakenTime(hostname);
    const growth_rate = ns.getServerGrowth(hostname);
    const min_sec = ns.getServerMinSecurityLevel(hostname);
    const max_money = ns.getServerMaxMoney(hostname);
    const target_money = max_money * .1;
    const hack_rate = ns.hackAnalyze(hostname);
    const t_h = Math.floor(Math.min(target_money/(max_money* hack_rate), total_threads / 9));
    const money = hack_rate * max_money;



    const hack_cost = ns.hackAnalyzeSecurity(t_h);
    const hack_time = ns.getHackTime(hostname);
    let times_to_grow = ns.growthAnalyze(hostname, 1 + hack_rate * t_h);

    const growth_time = grow_time * times_to_grow;
    const growth_cost = ns.growthAnalyzeSecurity(times_to_grow);
    const times_to_weaken = (hack_cost + growth_cost) / (0.05);
    const weaken_time = weak_time * times_to_weaken;
    const times_can_grow = hack_time / grow_time;
    const times_can_weaken = hack_time / weak_time;

    if (debug) {
        ns.tprintf("\nHost: %s", hostname);
        ns.tprintf("\tgrow time: %d", grow_time);
        ns.tprintf("\tweak time: %d", weak_time);
        ns.tprintf("\tgrowth rate: %d", growth_rate);
        ns.tprintf("\tmin sec: %d", min_sec);
        ns.tprintf("\tmax $$$: $%d", max_money);
        ns.tprintf("\thack $$$: $%d", money);
        ns.tprintf("\thack cost: %f", hack_cost);
        ns.tprintf("\thack time: %d", hack_time);
        ns.tprintf("\ttimes to grow: %d", times_to_grow);
        ns.tprintf("\ttimes can grow: %f", times_can_grow);
        ns.tprintf("\tgrowth time: %d", growth_time);
        ns.tprintf("\tgrowth cost: %f", growth_cost);
        ns.tprintf("\ttimes to weaken: %d", times_to_weaken);
        ns.tprintf("\ttimes can weaken: %f", times_can_weaken);
        ns.tprintf("\tweaken time: %d", weaken_time);
        ns.tprintf("\tt_h: %d", t_h);
    }

    let batch_threads = (t_h + times_to_grow + times_to_weaken);


    // let batches = hack_time / 1000;
    let batches = Math.floor(total_threads / batch_threads); 


    return {
        "t_h": t_h,
        "t_g": times_to_grow,
        "t_w": times_to_weaken,
        "s_h": grow_time - hack_time,
        "s_g": weak_time - grow_time,
        "batches": batches,
        "hack_time": hack_time,
        "grow_time": grow_time,
        "weak_time": weak_time,
        "period": Math.max(hack_time, grow_time, weak_time)/batches
    };
}

/** @param {NS} ns **/
function log(ns, msg, ...args) {
    ns.tprintf(msg, args);
}