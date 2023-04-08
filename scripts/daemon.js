import { breakPorts, can_root } from "/scripts/utils.js";

let id = 0;

/** @param {import(".").NS } ns */
export async function main(ns) {
  // initialization & config
  // set up any constants
  const host = ns.getHostname();

  const loop_period = 1000; //millisec

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
        ns.print("killing processes on " + s.name);
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
      //if (s.max_money == 0 || !s.can_hack || s.name == "home") {
      if (s.max_money == 0 || s.name == "home") {
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

    workers = servers.filter((a) => a.is_rooted)
    //sort workers by name, then by ram
    workers.sort((a, b) => a.name - b.name);
    workers.sort((a, b) => getRam(ns, b) - getRam(ns, a));
    ns.print(workers.map((a) => a.name));

    // clean out prepping list
    preping = preping.filter((a) => a.pids.some(ns.isRunning));
    to_prepare.sort((a, b) => a.max_money - b.max_money);

    await hackingPhase(ns, targets, hacks, workers, hack_script, weaken_script, grow_script);

    //TODO: figure out when prep is over and schedule batching to begin ASAP
    // for ever target we need to prepare, devote resources to prep
    await prepPhase(ns, to_prepare, preping, hacks, workers);

    await rootingPhase(ns, future);

    await ns.sleep(loop_period);
  } while (loop);
  ns.print("Somehow exiting daemon!");
}

/** @param {import(".").NS } ns */
async function prepPhase(ns, to_prepare, preping, hacks, workers) {
  ns.print("Begin Prepare phase for " + to_prepare.length + " servers");
  ns.print(to_prepare.map((a) => a.name));
  for (let p of to_prepare) {
    await prepare(ns, preping, hacks, workers, p);
    //let x = prepare(ns, preping, workers, p);
    //Promise.all;
  }
}

/** @param {import(".").NS } ns */
async function rootingPhase(ns, future) {
  ns.print("Begin Rooting phase for " + future.length + " servers");
  for (let f of future) {
    if (await can_root(ns, f.name)) {
      breakPorts(ns, f.name);
      ns.nuke(f.name);
    }
  }
}

/** @param {import(".").NS } ns */
async function hackingPhase(ns, targets, hacks, workers, hack_script, weaken_script, grow_script) {
  ns.print(
    "Begin Hacking phase for " + targets.length + " new servers, already hacking " + Object.keys(hacks).length
  );
  if (targets.length > 0)
    ns.print(targets.map((a) => a.name));
  targets.sort((a, b) => a.max_money - b.max_money);
  targets.sort((b, a) => a.weak_time - b.weak_time);
  // if (ns.getPlayer().money < 10 ** 9)
  //   targets = targets.filter((a) => a.name == "n00dles");
  // hack prepared targets
  for (let t of targets) {
    let s_g = t.weaken_time - t.grow_time;
    let s_h = t.weaken_time - t.hack_time;
    let batches = Math.ceil(Math.min(/*once per sec*/ t.weaken_time / 1000, 100));

    let period = t.weaken_time / batches;

    //ns.tprint(hacks[t.name])
    const loop = false;

    for (let i = 0; i < batches; i++) {
      const delay = 100;
      let pid = await run_wgh(ns, workers, t.name, t.t_h, (3 * delay) + i * period, s_h, loop, hack_script, id);
      let x = hacks[t.name];
      if (x != undefined)
        hacks[t.name].push(...pid);

      else
        hacks[t.name] = pid;

      hacks[t.name].push(...await run_wgh(ns, workers, t.name, t.t_w_h, (0 * delay) + i * period, 0, loop, weaken_script, id));
      hacks[t.name].push(...await run_wgh(ns, workers, t.name, t.t_g, (1 * delay) + i * period, s_g, loop, grow_script, id));
      hacks[t.name].push(...await run_wgh(ns, workers, t.name, t.t_w_g, (2 * delay) + i * period, 0, loop, weaken_script, id++));
      //ns.tprint(hacks)
    }
  }
  ns.print("End Hacking phase for " + targets.length + " new servers, already hacking " + Object.keys(hacks).length);
}

/**
 * @param {import(".").NS } ns
 **/
async function prepare(ns, preping, hacks, workers, target) {
  // don't prepare something already being prepared
  if (preping.some((a) => a.host == target.name)) return;

  // stop any running hacks if we want to prep this thing
  if (hacks[target.name] != undefined) {
    // ns.tprint("Killing to prep on " + target.name);
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

  preping.push({ host: target.name, pids: [...wi, ...gi, ...wg] });
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
 * @param {bool} stocks
 */
async function run_wgh(ns, workers, target, required_threads, delay, sleep_time, loop, script, id, stocks) {
  // find server to run script w/ required threads
  let pids = []
  let done = false;
  for (let w of workers) {
    const max_ram = ns.getServerMaxRam(w.name);
    let ram = max_ram - ns.getServerUsedRam(w.name);
    if (w.name == "home") {
      ram -= Math.floor(max_ram / 16);
    }
    let avail_threads = Math.floor(ram / ns.getScriptRam(script, w.name));
    let l = loop ? "-l" : "";
    let threads_to_use = required_threads;
    if (avail_threads < required_threads) {
      required_threads -= avail_threads;
      threads_to_use = avail_threads;
      if (required_threads < 1)
        done = true;
    } else {
      done = true;
    }
    //ns.tprintf("server: %s, script: %s, target: %s, required threads: %d, avail threads: %d\n", w.name, script, target, required_threads, avail_threads);
    let args = ["--target", target, "--delay", delay, "--sleep", sleep_time, "--id", id];
    if (loop)
      args.push("--loop");
    if (stocks)
      args.push("--stocks");
    if (threads_to_use > 0) {
      let pid = ns.exec(script, w.name, threads_to_use, ...args);
      if (pid != 0)
        pids.push(pid);
    }
    if (done) break;
  }
  if (false && pids.length == 0)
    ns.printf("No Server had enough ram to run %s: %.2fGB", script, ns.getScriptRam(script));
  return pids;
}

/**  @param {import(".").NS } ns **/
function getRam(ns, host) {
  return host.ram - ns.getServerUsedRam(host.name);
}
