import { breakPorts, can_root } from "/scripts/utils.js";

let id = 0;

/** @param {import(".").NS } ns */
export async function main(ns) {
  // initialization & config
  // set up any constants
  const host = ns.getHostname();

  const loop_period = 5000; //millisec

  const hack_script = "/scripts/basics/hack.js";
  const grow_script = "/scripts/basics/grow.js";
  const weaken_script = "/scripts/basics/weaken.js";

  ns.disableLog("getServerNumPortsRequired");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
  ns.disableLog("kill");
  //ns.disableLog("exec");
  // calculate static values

  // create necessary data structures

  // check for the precense of our data files

  var preping = [];
  var hacks = {};

  let debug = false;
  let loop = false;
  let initialized = false;
  ns.print("Begining loop");
  // active loop
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
      continue;
    }

    // Targets we want to hack, but need to prepare
    if (s.cur_money < s.max_money || s.cur_sec > s.min_sec) {
      prepare(ns, s);
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
    if (s.can_hack == true) {
      targets.push(s);
    }
  } // end for loop

  //sort workers by name, then by ram
  workers.sort((a, b) => a.name - b.name);
  workers.sort((a, b) => getRam(ns, b) - getRam(ns, a));
  //ns.print(workers.map((a) => a.name));

  let count = 0;
  for (let p of to_prepare) {
    prepare(ns, preping, hacks, workers, p);
  }

  targets.sort((a, b) => b.max_money - a.max_money);

  //ns.tprint(preping);
}

/** @param {NS} ns **/
function prepare(ns, preping, target) {
  // don't prepare something already being prepared
  if (preping.some((a) => a.host == target.name)) return;

  // stop any running hacks if we want to prep this thing

  let tg = target.t_g_i;
  let twi = target.t_w_i;
  let twg = target.t_w_g_i;
  let grow_time = target.grow_time;
  let weak_time = target.weaken_time;

  let s_g = weak_time - grow_time + 50;
  const grow_script = "/scripts/basics/grow.js";
  const weaken_script = "/scripts/basics/weaken.js";
  let pids = [];

  pids.concat(run_wgh(ns, workers, target.name, twi, 0, 0, false, weaken_script, id++));
  let grow = [];
  do {
    grow = run_wgh(ns, workers, target.name, tg, 0, s_g, false, grow_script, id++);
    tg = Math.floor(tg / 2);
  } while (grow.length == 0 && tg > 0);
  pids.concat(grow);
  pids.concat(run_wgh(ns, workers, target.name, twg, 0, 100, false, weaken_script, id++));

  if (pids.length != 3) {
    for (let p of pids) {
      ns.kill(p);
    }
    ns.print("Error: prepare failed  on " + target.name);
    return;
  }

  if (pids.length > 0) preping.push({ host: target.name, pids: pids });
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
 * @return {[number]}
 */
function run_wgh(ns, workers, target, required_threads, delay, sleep_time, loop, script, id) {
  // TODO: make this schedule whatever threads are able, and then move onto the next server
  // i.e, schedule a partial task on s1, then the rest on s2, etc.

  let pids = [];
  // find server to run script w/ required threads
  for (let w of workers) {
    // reserve 25GB on home
    let res = w.name == "home" ? 25 : 0;
    let ram = ns.getServerMaxRam(w.name) - ns.getServerUsedRam(w.name) - res;
    let t = Math.floor(ram / ns.getScriptRam(script, w.name));
    if (t <= 0) continue;
    let l = loop ? "-l" : "";
    let threads_to_use = 0;
    if (t >= required_threads) {
      threads_to_use = required_threads;
    } else {
      continue;
      threads_to_use = t;
    }
    required_threads -= threads_to_use;
    let pid = ns.exec(script, w.name, threads_to_use, target, delay, sleep_time, l, id);
    pids.push(pid);
    if (required_threads == 0) return pids;
  }
  //  ns.print(ns.sprintf("No Server had enough ram to run %s: %.2fGB", script, required_threads * ns.getScriptRam(script)));
  return pids;
}

/**  @param {import(".").NS } ns **/
function getRam(ns, host) {
  return host.ram - ns.getServerUsedRam(host.name);
}
