// @ts-ignore
import { breakPorts, can_root } from "/scripts/utils.js";

// @ts-ignore
import { ServerData } from "/scripts/ServerData.js";

let id = 0;

class Scripts {
  constructor(hacking, grow, weaken) {
    this.hack = hacking;
    this.grow = grow;
    this.weaken = weaken;
  }

}

const scripts = new Scripts("/scripts/basics/hack.js", "/scripts/basics/grow.js", "/scripts/basics/weaken.js",);


/** @param {import(".").NS } ns */
export async function main(ns) {
  // initialization & config
  // set up any constants
  const host = ns.getHostname();

  const loop_period = 500; //millisec

  ns.disableLog("getServerNumPortsRequired");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
  ns.disableLog("exec");
  ns.disableLog("kill");
  // calculate static values

  // create necessary data structures

  // check for the precense of our data files

  let preping = new Map();
  let hacks = new Map();

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
    await ns.sleep(50);
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

    let start_money = ns.getPlayer().money;

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
      let t = hacks.get(s.name);
      if (t != undefined && t.length != 0) {
        if (t.some(ns.isRunning)) {
          continue;
        }
        hacks.delete(s.name);
        //ns.tprint(s.name, Object.keys(hacks));
      }
      targets.push(s);
    } // end for loop

    //sort workers by name, then by ram
    workers = servers
      .filter((a) => a.is_rooted)
      .sort((a, b) => a.name - b.name)
      .sort((a, b) => getRam(ns, b) - getRam(ns, a));

    // clean out prepping list
    //preping = preping.filter((a) => a.pids.some(ns.isRunning));
    preping.forEach((value, key) => {
      if (!value.some(ns.isRunning)) preping.delete(key);
    });
    to_prepare = to_prepare
      .sort((a, b) => a.max_money - b.max_money)
      .sort((a, b) => a.weak_time - b.weak_time);

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

    // do we execute hwgw scripts in a loop?
    const loop_scripts = false;
    // do hwgw scripts affect the stock market?
    const affect_stocks = false;
    // Try to be more focused if we don't have a lot of money
    if (ns.getPlayer().money < 10 ** 7) {
      targets = targets.filter((a) => a.name == "joesguns");
      to_prepare = to_prepare.filter((a) => a.name == "joesguns");
      // const max_len = 3;
      // if (targets.length > max_len)
      // targets = targets.slice(0, max_len);
      await hackingPhase(ns, targets, hacks, workers, loop_scripts, affect_stocks);
      await prepPhase(ns, to_prepare, preping, hacks, workers);
    } else {
      await prepPhase(ns, to_prepare, preping, hacks, workers);
      await hackingPhase(ns, targets, hacks, workers, loop_scripts, affect_stocks);
    }

    await rootingPhase(ns, future);

    await ns.sleep(loop_period);
    let end_money = ns.getPlayer().money;
    var formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    ns.printf("Wealth Delta: %s", formatter.format(end_money - start_money));

  } while (loop);
  ns.print("Somehow exiting daemon!");
}

/**
 * @param {import(".").NS } ns
 * @param {ServerData[]} to_prepare
 * @param {Map<string, Number[]>} preping
 * @param {Map<string, Number[]>} hacks
 * @param {ServerData[]} workers
 */
async function prepPhase(ns, to_prepare, preping, hacks, workers) {
  ns.print("Begin Prepare phase for " + to_prepare.length + " servers");
  ns.print(to_prepare.map((a) => a.name));
  for (let p of to_prepare) {
    await prepare(ns, preping, hacks, workers, p);
  }
}

/**
 * @param {import(".").NS} ns
 * @param {ServerData[]} future
 */
async function rootingPhase(ns, future) {
  ns.print("Begin Rooting phase for " + future.length + " servers");
  for (let f of future) {
    if (await can_root(ns, f.name)) {
      breakPorts(ns, f.name);
      ns.nuke(f.name);
    }
  }
}

/**
 * @param {import(".").NS } ns
 * @param {ServerData[]} targets
 * @param {ServerData[]} workers
 * @param {Map<string, Number[]>} hacks
 * @param {boolean} loop
 * @param {boolean} stocks
 *
 */
async function hackingPhase(ns, targets, hacks, workers, loop, stocks) {
  ns.printf(
    "Begin Hacking phase for %d new servers, already hacking %d",
    targets.length,
    hacks.size
  );
  targets.sort((a, b) => a.max_money - b.max_money);
  // targets.sort((b, a) => a.weak_time - b.weak_time);

  if (targets.length > 0) ns.print(targets.map((a) => a.name));

  // hack prepared targets
  for (let t of targets) {
    let s_g = t.weaken_time - t.grow_time;
    let s_h = t.weaken_time - t.hack_time;

    let weaken_grow_ram = ns.getScriptRam(scripts.weaken) * t.t_w_h;
    let weaken__hack_ram = ns.getScriptRam(scripts.weaken) * t.t_w_g;
    let grow_ram = ns.getScriptRam(scripts.grow) * t.t_g;
    let hack_ram = ns.getScriptRam(scripts.hack) * t.t_h;
    let required_ram = weaken_grow_ram + weaken__hack_ram + grow_ram + hack_ram;

    const delay = 50;
    const batch_time = t.weaken_time + 4 * delay;
    // let batches = Math.ceil(Math.min(/*once per sec*/ t.weaken_time / 500, 100));
    let batches = Math.ceil(batch_time / (4 * delay));
    let period = batch_time / batches;

    for (let i = 0; i < batches; i++) {
      let server = find_server_for_batch(ns, workers, required_ram);

      // let pid = await run_wgh(ns, workers, t.name, t.t_h, 4 * delay + i * period, s_h, loop, hack_script, id, stocks);
      // pid.push(...(await run_wgh(ns, workers, t.name, t.t_w_h, 1 * delay + i * period, 0, loop, weaken_script, id, stocks)));
      // pid.push(...(await run_wgh(ns, workers, t.name, t.t_g, 2 * delay + i * period, s_g, loop, grow_script, id, stocks)));
      // pid.push(...(await run_wgh(ns, workers, t.name, t.t_w_g, 3 * delay + i * period, 0, loop, weaken_script, id++, stocks)));

      let period_offset = i * period;

      let pid = await batch_runner(ns, server, t, delay, period_offset, s_h, loop, stocks, s_g);

      let running_hacks = hacks.get(t.name);
      if (running_hacks != undefined) {
        running_hacks.push(...pid);
      } else {
        hacks.set(t.name, pid);
      }
    }
  }
  ns.printf(
    "End Hacking phase for %d new servers, already hacking %d",
    targets.length,
    hacks.size
  );
}


/**
 * @param {import(".").NS } ns
 * @param {Object} target
 * @param {Object[]} workers
 * @param {Map<string, Number[]>} hacks
 * @param {Map<string, Number[]>} preping
 *
 */
async function prepare(ns, preping, hacks, workers, target) {
  // don't prepare something already being prepared
  if (preping.has(target.name)) return;

  let pids = hacks.get(target.name);
  // stop any running hacks if we want to prep this thing
  if (pids != undefined) {
    // ns.tprint("Killing to prep on " + target.name);
    for (let pid of pids) {
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
  let wi = await run_wgh(ns, workers, target.name, twi, 0, 0, false, weaken_script, id++, false);
  let gi = await run_wgh(ns, workers, target.name, tg, 0, s_g, false, grow_script, id++, false);
  let wg = await run_wgh(ns, workers, target.name, twg, 0, 100, false, weaken_script, id++, false);

  preping.set(target.name, [...wi, ...gi, ...wg]);
}

/**
 * @param {import(".").NS } ns
 * @param {any[] }workers
 * @param {string} target
 * @param {number} required_threads
 * @param {number} delay
 * @param {number} sleep_time
 * @param {boolean} loop
 * @param {string} script
 * @param {number} id
 * @param {boolean} stocks
 */
async function run_wgh(ns, workers, target, required_threads, delay, sleep_time, loop, script, id, stocks) {
  const enable_split_batching = false;
  const debug = false;
  // find server to run script w/ required threads
  let pids = [];
  let done = false;
  for (let w of workers) {
    const max_ram = w.ram;
    let ram = max_ram - ns.getServerUsedRam(w.name);
    if (w.name == "home") {
      ram -= max_ram / 16;
    }
    let avail_threads = Math.floor(ram / ns.getScriptRam(script, w.name));
    let threads_to_use = required_threads;
    if (enable_split_batching) {
      if (avail_threads < required_threads) {
        required_threads -= avail_threads;
        threads_to_use = avail_threads;
        if (required_threads < 1)
          done = true;
      } else {
        done = true;
      }
    } else {
      if (avail_threads < required_threads)
        continue;
      done = true;
    }
    //ns.tprintf("server: %s, script: %s, target: %s, required threads: %d, avail threads: %d\n", w.name, script, target, required_threads, avail_threads);
    let args = ["--target", target, "--delay", delay, "--sleep", sleep_time, "--id", id,];
    if (loop)
      args.push("--loop");
    if (stocks)
      args.push("--stocks");
    if (threads_to_use > 0) {
      let pid = ns.exec(script, w.name, threads_to_use, ...args);
      if (pid != 0) pids.push(pid);
    }
    if (done)
      break;
  }
  if (debug && pids.length == 0)
    ns.printf("No Server had enough ram to run %s: %.2fGB", script, ns.getScriptRam(script));
  return pids;
}

/**  @param {import(".").NS } ns **/
function getRam(ns, host) {
  return host.ram - ns.getServerUsedRam(host.name);
}


/**
 * @param {import(".").NS } ns
 * @param {any[] }workers
 * @param {number} required_ram
 */
function find_server_for_batch(ns, workers, required_ram) {
  // let weaken_g = undefined;
  // let weaken_h = undefined;
  // let grow = undefined;
  // let hack = undefined;
  // let ret = { "weaken_grow": weaken_g, "weaken_hack": weaken_h, "grow": grow, "hack": hack };

  // if we can run everything on a single server, then do that
  for (let w of workers) {
    if (getRam(ns, w) >= required_ram) {
      return w;
    }
  }

  // TODO: calculate this for hack , weaken and grow
  // for (let w of workers) {
  // }

  // for (let w of workers) {
  // }

  // for (let w of workers) {
  // }

  // for (let w of workers) {
  // }

  return null;

}


/**
 * @param {import(".").NS } ns
 * @param {any} server
 * @param {string} target
 * @param {number} required_threads
 * @param {number} delay
 * @param {number} sleep_time
 * @param {boolean} loop
 * @param {string} script
 * @param {number} id
 * @param {boolean} stocks
 */
async function run_batch(ns, server, target, required_threads, delay, sleep_time, loop, script, id, stocks) {
  let pids = [];
  if (server == undefined || required_threads <= 0)
    return pids;
  let args = batch_args(target, delay, sleep_time, id, loop, stocks);
  let pid = ns.exec(script, server.name, required_threads, ...args);
  if (pid != 0) pids.push(pid);
  return pids;
}


/**
 * @param {string} target
 * @param {number} delay
 * @param {number} sleep_time
 * @param {number} id
 * @param {boolean} loop
 * @param {boolean} stocks
 */
function batch_args(target, delay, sleep_time, id, loop, stocks) {
  let args = ["--target", target, "--delay", delay, "--sleep", sleep_time, "--id", id,];
  if (loop)
    args.push("--loop");
  if (stocks)
    args.push("--stocks");
  return args;
}

/**
 * @param {import(".").NS} ns
 * @param {undefined} server
 * @param {ServerData} target
 * @param {number} delay
 * @param {number} period_offset
 * @param {number} s_h
 * @param {boolean} loop
 * @param {boolean} stocks
 * @param {number} s_g
 */
async function batch_runner(ns, server, target, delay, period_offset, s_h, loop, stocks, s_g) {
  let pids = [];
  if (server == undefined)
    return pids;

  pids.push(...await run_batch(ns, server, target.name, target.t_h, 4 * delay + period_offset, s_h, loop, scripts.hack, id, stocks));
  pids.push(...await run_batch(ns, server, target.name, target.t_w_h, 1 * delay + period_offset, 0, loop, scripts.weaken, id, stocks));
  pids.push(...await run_batch(ns, server, target.name, target.t_g, 2 * delay + period_offset, s_g, loop, scripts.grow, id, stocks));
  pids.push(...await run_batch(ns, server, target.name, target.t_w_g, 3 * delay + period_offset, 0, loop, scripts.weaken, id++, stocks));
  return pids;
}