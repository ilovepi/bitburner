/** @param {import("..").NS } ns */
export async function main(ns) {
  var formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const my_money = ns.getServerMoneyAvailable("home");
  ns.tprintf("Available %s", formatter.format(my_money));
  const servers = ns.getPurchasedServers();
  const per_server = my_money / Math.max(servers.length, 1);

  ns.tprintf("Per Server %s", formatter.format(per_server));
  var max_ram = ns.getPurchasedServerMaxRam();
  ns.tprintf("Max Ram: %d", max_ram);
  const min_server_ram = find_min_server_ram(ns);
  ns.tprintf("My Max Ram: %d", min_server_ram);

  let cost = 0;
  if (servers.length < 25) {
  ({ max_ram, cost } = determineServerSize(max_ram, min_server_ram, cost, ns, my_money));
    if (my_money > cost) {
      ns.purchaseServer("s" + servers.length, max_ram);
      return;
    }
  }

  ({ max_ram, cost } = determineServerSize(max_ram, min_server_ram, cost, ns, per_server));

  if (max_ram < find_min_server_ram(ns)) {
    ns.tprintf("Max Ram is not upgradable. Ram: %d, Cost: %s", max_ram, formatter.format(cost));
    max_ram = 2 * min_server_ram;
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

function determineServerSize(max_ram, my_ram, cost, ns, per_server) {
  while (max_ram > my_ram) {
    cost = ns.getPurchasedServerCost(max_ram);
    if (per_server < cost)
      max_ram = max_ram / 2;
    else {
      ns.tprintf("Max Ram Upgrade: %d for $%d", max_ram, cost);
      break;
    }
  }
  return { max_ram, cost };
}

/** @param {import("..").NS } ns */
function my_max_ram(ns) {
  const servers = ns.getPurchasedServers();
  return servers
    .map((s) => ns.getServerMaxRam(s))
    .reduce((a, b) => Math.max(a, b), -Infinity);
}

/** @param {import("..").NS } ns */
export function find_min_server_ram(ns) {
  const servers = ns.getPurchasedServers();
  if (servers.length == 0)
    return 0;
  return servers
    .map((s) => ns.getServerMaxRam(s))
    .reduce((a, b) => Math.min(a, b), Infinity);
}

