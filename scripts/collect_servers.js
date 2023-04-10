// @ts-ignore
import { find_all_servers } from "/scripts/utils.js";

// @ts-ignore
import { ServerData } from "/scripts/ServerData.js";

/**  @param {import(".").NS } ns **/
export async function main(ns) {
  let data = [];
  let servers = await find_all_servers(ns);
  const files = ["/scripts/basics/grow.js", "/scripts/basics/weaken.js", "/scripts/basics/hack.js"];
  const home = "home";

  for (const s of servers) {
    data.push(analysis(ns, s, false));
    if (s == home) continue;
    await ns.scp(files, s, home);
  }
  data.sort((a, b) => b.score - a.score);
  let s = JSON.stringify(data, null, 1);
  await ns.write("/data/server.json.txt", s, "w");
}

/**
 * @param {import(".").NS} ns *
 * @param {string} hostname
 * @param {boolean} debug
 */
function analysis(ns, hostname, debug) {
  const hack_ratio = 0.1;

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
  if (max_money == 0 || cur_money == 0 || max_money == cur_money) ratio = 2;

  const t_g_i = Math.ceil(ns.growthAnalyze(hostname, ratio));
  const t_g = Math.ceil(ns.growthAnalyze(hostname, 1 / (1 - hack_ratio)) * 1.2);
  const sec_g_i = ns.growthAnalyzeSecurity(t_g_i);
  const sec_g = ns.growthAnalyzeSecurity(t_g);

  // weaken stats

  const weak_time = ns.getWeakenTime(hostname);
  const weaken_value = ns.weakenAnalyze(1);
  const t_w_i = Math.max(1, Math.ceil((cur_sec - min_sec) / weaken_value));
  const t_w_g_i = Math.ceil(sec_g_i / weaken_value);
  const t_w_g = Math.ceil(sec_g / weaken_value);
  const t_w_h = Math.ceil(hack_cost / weaken_value);

  const money = hack_rate * t_h * max_money;

  let stats = new ServerData(
    hostname,
    ns.hasRootAccess(hostname),
    ns.getServerRequiredHackingLevel(hostname) < ns.getHackingLevel(),
    ns.getServerMaxRam(hostname),
    max_money,
    cur_money,
    money,
    min_sec,
    cur_sec,
    hack_rate,
    hack_chance,
    t_h,
    hack_cost,
    hack_time,
    growth,
    grow_time,
    t_g_i,
    t_g,
    sec_g_i,
    sec_g,
    weaken_value,
    weak_time,
    t_w_i,
    t_w_g_i,
    t_w_g,
    t_w_h
  );

  if (debug) {
    let s = JSON.stringify(stats, null, 1);
    ns.tprint(s);
  }
  return stats;
}
