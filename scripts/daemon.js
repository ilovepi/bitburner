import { breakPorts, can_root } from "/scripts/utils.js";

let id = 0;

/** @param {import(".").NS } ns */
export async function main(ns) {
  // initialization & config
  // set up any constants
  const host = ns.getHostname();

  const loop_period = 200; //millisec

  const hack_script = "/scripts/basics/hack.js";
  const grow_script = "/scripts/basics/grow.js";
  const weaken_script = "/scripts/basics/weaken.js";

  ns.disableLog("getServerNumPortsRequired");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
  //ns.disableLog("exec");
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
    // if servers are too poor or sec too high, our scripts are
    // not working correctly, kill and add to prep list
    ns.exec("/scripts/collect_servers.js", host);
    await ns.sleep(100);
    var servers = JSON.parse(ns.read("/data/server.json.txt"));
    if (!initialized) {
      for (let s of servers) {
        if (s.name === "home") continue;
        //ns.print("killing processes on " + s.name);
        await ns.killall(s.name);
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
      //if (s.max_money == 0 || !s.can_hack || s.name == "home") {
      if (s.max_money == 0 || s.name == "home") {
        workers.push(s);
        continue;
      }

      // Targets we want to hack, but need to prepare
      if (s.cur_money < 0.8 * s.max_money || s.cur_sec > s.min_sec + 1) {
        to_prepare.push(s);
        continue;
      }

      // Everything else is a target we can hack now, unless wer're already hacking it
      let t = hacks[s.name];
      if (t != undefined && t.length != 0) {
        if (t.some(ns.isRunning)) {
          workers.push(s);
          continue;
        }
        delete hacks[s.name];
        //ns.tprint(s.name, Object.keys(hacks));
      }
      targets.push(s);
    } // end for loop

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

    //sort workers by name, then by ram
    workers.sort((a, b) => a.name - b.name);
    workers.sort((a, b) => getRam(ns, b) - getRam(ns, a));
    ns.print(workers.map((a) => a.name));

    // clean out prepping list
    preping = preping.filter((a) => a.pids.some(ns.isRunning));
    to_prepare.sort((a, b) => a.max_money - b.max_money);

    //TODO: figure out when prep is over and schedule batching to begin ASAP
    // for ever target we need to prepare, devote resources to prep
    ns.print("Begin Prepare phase for " + to_prepare.length + " servers");
    ns.print(to_prepare.map((a) => a.name));
    for (let p of to_prepare) {
      await prepare(ns, preping, hacks, workers, p);
      //let x = prepare(ns, preping, workers, p);
      //Promise.all;
    }

    ns.print(
      "Begin Hacking phase for " + targets.length + " new servers, already hacking " + Object.keys(hacks).length,
    );
    targets.sort((a, b) => a.max_money - b.max_money);
    // hack prepared targets
    for (let t of targets) {
      let s_g = t.weaken_time - t.grow_time;
      let s_h = t.weaken_time - t.hack_time;
      let batches = Math.ceil(Math.min(/*once per sec*/ t.weaken_time / 1000, 100));

      let period = t.weaken_time / batches;

      for (let i = 0; i < batches; i++) {
        let pid = await run_wgh(ns, workers, t.name, t.t_h, 150 + i * period, s_h, true, hack_script, id);
        let x = hacks[t.name];
        if (x != undefined) hacks[t.name].push(pid);
        else hacks[t.name] = [pid];

        hacks[t.name].push(await run_wgh(ns, workers, t.name, t.t_w_h, i * period, 0, true, weaken_script, id));
        hacks[t.name].push(await run_wgh(ns, workers, t.name, t.t_g, 50 + i * period, s_g, true, grow_script, id));
        hacks[t.name].push(await run_wgh(ns, workers, t.name, t.t_w_g, 100 + i * period, 0, true, weaken_script, id++));
      }
    }
    ns.print("End Hacking phase for " + targets.length + " new servers, already hacking " + Object.keys(hacks).length);

    ns.print("Begin Rooting phase for " + future.length + " servers");
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
async function prepare(ns, preping, hacks, workers, target) {
  // don't prepare something already being prepared
  if (preping.some((a) => a.host == target.name)) return;

  // stop any running hacks if we want to prep this thing
  if (hacks[target.name] != undefined) {
    //ns.tprint("Killing to prep on " + target.name);
    for (let pid of hacks[target.name]) {
      ns.kill(pid);
    }
  }

  let tg = target.t_g_i;
  let twi = target.t_w_i;
  let twg = target.t_w_g_i;
  let grow_time = target.grow_time;
  let weak_time = target.weaken_time;

  let s_g = weak_time - grow_time + 50;
  const grow_script = "/scripts/basics/grow.js";
  const weaken_script = "/scripts/basics/weaken.js";

  let wi = await run_wgh(ns, workers, target.name, twi, 0, 0, false, weaken_script, id++);
  let gi = await run_wgh(ns, workers, target.name, tg, 0, s_g, false, grow_script, id++);
  let wg = await run_wgh(ns, workers, target.name, twg, 0, 100, false, weaken_script, id++);

  preping.push({ host: target.name, pids: [wi, gi, wg] });
}

/**
 * @param {import(".").NS } ns
 * @param {[any] }workers
 * @param {string} target
 * @param {number} required_threads
 * @param {number} delay
 * @param {number} sleep_time
 * @param {bool} loop
 * @param {string} script
 * @param {number} id
 */
async function run_wgh(ns, workers, target, required_threads, delay, sleep_time, loop, script, id) {
  // TODO: make this schedule whatever threads are able, and then move onto the next server
  // i.e, schedule a partial task on s1, then the rest on s2, etc.

  // find server to run script w/ required threads
  for (let w of workers) {
    let ram = ns.getServerMaxRam(w.name) - ns.getServerUsedRam(w.name);
    let t = Math.floor(ram / ns.getScriptRam(script, w.name));
    let l = loop ? "-l" : "";
    if (t < required_threads) {
      continue;
    }
    return ns.exec(script, w.name, required_threads, target, delay, sleep_time, l, id);
  }
  //TODO: make this a log message
  ns.tprintf("No Server had enough ram to run %s: %.2fGB", script, ns.getScriptRam(script));
  return 0;
}

/**  @param {import(".").NS } ns **/
function getRam(ns, host) {
  return host.ram - ns.getServerUsedRam(host.name);
}
