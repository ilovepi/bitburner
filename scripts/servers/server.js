/** @param {import("..").NS } ns */
export async function main(ns) {
  var formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const my_money = ns.getServerMoneyAvailable("home");
  ns.tprintf("Available %s", formatter.format(my_money));
  const per_server = my_money;

  ns.tprintf("Per Server %s", formatter.format(per_server));
  var max_ram = ns.getPurchasedServerMaxRam();
  ns.tprintf("Max Ram: %d", max_ram);
  const my_ram = my_min_ram(ns);
  ns.tprintf("My Max Ram: %d", my_ram);

  var cost = 0;
  while (max_ram > my_ram) {
    cost = ns.getPurchasedServerCost(max_ram);
    if (per_server < cost) max_ram = max_ram / 2;
    else {
      ns.tprintf("Max Ram Upgrade: %d for $%d", max_ram, cost);
      break;
    }
  }

  if (max_ram < my_min_ram(ns)) {
    ns.tprintf("Max Ram is not upgradable. Ram: %d, Cost: %s", max_ram, formatter.format(cost));
    max_ram = 2 * my_ram;
    cost = ns.getPurchasedServerCost(max_ram);
    let total = cost * ns.getPurchasedServerLimit();

    ns.tprintf(
      "Cost of next upgrade: Ram: %d, Cost per server: %s, Total %s:",
      max_ram,
      formatter.format(cost),
      formatter.format(total),
    );
    return;
  }

  const servers = ns.getPurchasedServers();
  if (servers.length < 25) {
    ns.purchaseServer("s" + servers.length, max_ram);
    return;
  }
  let min = servers[0];
  for (const s of servers) {
    if (ns.getServerMaxRam(s) < ns.getServerMaxRam(min)) {
      min = s;
    }
  }
  ns.killall(min);
  ns.deleteServer(min);
  ns.tprintf("Deleted server: %s", min);
  ns.purchaseServer(min, max_ram);
  ns.tprintf("Purchased server: %s with %d", min, max_ram);
}

/** @param {NS} ns **/
function my_max_ram(ns) {
  let max = 0;
  const servers = ns.getPurchasedServers();
  for (const s of servers) {
    var ram = ns.getServerMaxRam(s);
    if (ram > max) max = ram;
  }
  return max;
}

function my_min_ram(ns) {
  let min = my_max_ram(ns);
  const servers = ns.getPurchasedServers();
  for (const s of servers) {
    var ram = ns.getServerMaxRam(s);
    if (ram < min) min = ram;
  }
  return min;
}