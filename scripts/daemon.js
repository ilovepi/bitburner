import { breakPorts, can_root } from "/scripts/utils.js";


let id = 0;

/** @param {NS} ns **/
export async function main(ns) {
    // initialization & config
    // set up any constants
    const host = ns.getHostname();

    const loop_period = 10000; //millisec

    const hack_script = "/scripts/basics/hack.js";
    const grow_script = "/scripts/basics/grow.js";
    const weaken_script = "/scripts/basics/weaken.js";

    // calculate static values

    // create necessary data structures

    // check for the precense of our data files

    var preping = [];
    var hacks = {};

    let debug = false;
    let loop = true;
    let initialized = false;
    ns.print("Begining loop");
    // active loop
    do {
        // once per period scan servers and write data to file
        // collect a variety of data and parameter about the server
        // if servers are too poor or sec too high, our scripts are not working correctly, kill and add to prep list
        ns.exec("/scripts/collect_servers.js", host);
        await ns.sleep(100);
        var servers = JSON.parse(ns.read("/data/server.json.txt"));
        if (!initialized) {
            for (let s of servers) {
                if (s.name === "home")
                    continue;
                //ns.print("killing processes on " + s.name);
                ns.killall(s.name);
            }
            initialized = true;
            ns.print("initialized");
        }
        let to_prepare = [];
        let workers = [];
        let targets = [];
        let future = [];

        // categorize servers into groups
        for (let s of servers) {
            // targets we can't root go into a future list 
            // TODO: consider if we should just ignore alltogether
            if (!s.is_rooted) {
                future.push(s);
                continue;
            }

            // targets we can't hack yet <-- can be extra compute if rooted
            // targets that are not profitable to hack <-- i.e, they can be extra compute
            if (s.max_money == 0 || !s.can_hack || s.hack_chance < 0.4 || s.name == "home") {
                workers.push(s);
                continue;
            }

            // Targets we want to hack, but need to prepare
            if (s.cur_money < 0.9 * s.max_money) {
                to_prepare.push(s);
                continue;
            }

            // Everything else is a target we can hack now
            let t = hacks[s.name];
            if (t != undefined && t.length != 0) {
                for (let pid of t) {
                    if (ns.isRunning(pid)) {
                        ns.print(ns.vsprintf("Already hacking %s", s.name));
                        workers.push(s)
                        continue;
                    }
                }
                delete hacks[s.name];
            }
            targets.push(s);
        }

        if (debug) {
            ns.tprint("Future: ");
            ns.tprint(future);
            ns.tprint("Targets ");
            ns.tprint(targets);
            ns.tprintf("Workers: %d", workers.length);
            ns.tprintf("Perpare: %d", to_prepare.length);
            ns.tprint(to_prepare);
            ns.tprintf("Total: %d", servers.length);
        }

        workers.sort((a, b) => a.name - b.name);
        workers.sort((a, b) => b.ram - a.ram);
        ns.print(workers.map(a => a.name));
        to_prepare.sort((a, b) => a.max_money - b.max_money);
        //TODO: figure out when prep is over and schedule batching to begin ASAP
        // for ever target we need to prepare, devote resources to prep
        for (let p of to_prepare) {
            await prepare(ns, preping, workers, p);
        }

        targets.sort((a, b) => a.max_money - b.max_money);
        // hack prepared targets
        for (let t of targets) {

            let s_g = t.weaken_time - t.grow_time + 50;
            let s_h = t.weaken_time - t.hack_time + 150;
            let batches = Math.min(/*once per sec*/ t.weaken_time / 1000, 100);

            let period = t.weaken_time / batches;

            for (let i = 0; i < batches; i++) {

                let pid = await run_wgh(ns, workers, t.name, t.t_h, s_h + (i * period), true, hack_script, id);
                let x = hacks[t.name];
                if (x != undefined)
                    hacks[t.name].push(pid);
                else
                    hacks[t.name] = [pid];

                await run_wgh(ns, workers, t.name, t.t_w, i * period, true, weaken_script, id);
                await run_wgh(ns, workers, t.name, t.t_g, s_g + (i * period), true, grow_script, id);
                await run_wgh(ns, workers, t.name, t.t_w_g, 100 + (i * period), true, weaken_script, id++);
            }
        }

        for (let f of future) {
            if (await can_root(ns, f.name)) {
                breakPorts(ns, f.name);
                ns.nuke(f.name);
            }
        }

        await ns.sleep(loop_period);
    } while (loop);
    ns.print("Somehow exiting daemon!");
}

/** @param {NS} ns **/
async function prepare(ns, preping, workers, target) {
    // don't prepare something already being prepared
    let t = preping.find(a => a.host == target.name);
    if (t != undefined) {
        for (let pid of t.pids) {
            if (ns.isRunning(pid)) {
                ns.print(ns.vsprintf("Already preping %s", target.name));
                return;
            }
        }
        preping = preping.filter(a => a != t);
    }

    let tg = target.t_g_i;
    let twi = target.t_w_g_i;
    let twg = target.t_w_i;
    let grow_time = target.grow_time;
    let weak_time = target.weaken_time;

    let s_g = weak_time - grow_time + 50;
    const grow_script = "/scripts/basics/grow.js";
    const weaken_script = "/scripts/basics/weaken.js";


    let wi = await run_wgh(ns, workers, target.name, twi, 0, false, weaken_script, id++);
    let gi = await run_wgh(ns, workers, target.name, tg, s_g, false, grow_script, id++);
    //TODO: remove this debug block, when we're sure it is no longer needed
    if (twg < 1) {
        ns.tprint("Error on:");
        ns.tprint(target);
    }
    let wg = await run_wgh(ns, workers, target.name, twg, 100, false, weaken_script, id++);

    preping.push({ "host": target.name, "pids": [wi, gi, wg] });

}


/** @param {NS} ns **/
async function run_wgh(ns, workers, target, required_threads, sleep_time, loop, script, id) {
    //ns.tprint(workers);
    //workers.sort((a,b)=> getRam(b) - getRam(a));
    // find server to run script w/ required threads
    for (let w of workers) {
        let ram = ns.getServerMaxRam(w.name) - ns.getServerUsedRam(w.name);
        let t = ram / ns.getScriptRam(script);
        if (t < required_threads)
            continue;
        let l = loop ? "-l" : "";
        return ns.exec(script, w.name, required_threads, target, sleep_time, l, id);
    }
    return 0;
}

function getRam(ns, host) {
    return host.ram - ns.getServerUsedRam(host.name);
}