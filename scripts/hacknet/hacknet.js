/** @param {import("..").NS } ns */
export async function main(ns) {
  let can_try = true;
  let limit = 1000;
  do {
    let money = ns.getServerMoneyAvailable("home");
    let machine_count = ns.hacknet.numNodes();
    //ns.tprintf("Available Money: %d\n", money);

    let costs = [];
    for (let i = 0; i < machine_count; i++) {
      let p = ns.hacknet.getNodeStats(i);
      let cost_data = {
        index: i,
        costs: {
          level: ns.hacknet.getLevelUpgradeCost(i),
          ram: ns.hacknet.getRamUpgradeCost(i),
          core: ns.hacknet.getCoreUpgradeCost(i),
          cache: ns.hacknet.getCacheUpgradeCost(i),
        },
      };
      costs.push(cost_data);
      //  let base = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram, p.cores);
      //  let level = ns.formulas.hacknetNodes.moneyGainRate(p.level + 1, p.ram, p.cores);
      //  let ram = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram + 1, p.cores);
      //  let cores = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram, p.cores + 1);
    }
    let min_item = find_min(costs);
    let min = min_item_cost(min_item);
    //ns.tprint(min);

    const node_cost = ns.hacknet.getPurchaseNodeCost();
    if (node_cost < min || min == null || Number.isNaN(min)) {
      if (money > node_cost) {
        let num = ns.hacknet.purchaseNode();
        ns.tprint("Purchased node: " + num);
      } else
        can_try = false;
    } else {
      if (money < min) {
        can_try = false;
        return;
      }
      const index = min_item.index;
      // FIXME: does JS have a switch?
      switch (min) {
        case min_item.level: {
          ns.tprint("upgrade level id:" + index);
          ns.hacknet.upgradeLevel(index, 1);
          break;
        }
        case min.item.ram: {
          ns.tprint("upgrade ram id:" + index);
          ns.hacknet.upgradeRam(index, 1);
          break;

        }
        case min_item.core: {

          ns.tprint("upgrade core id:" + index);
          ns.hacknet.upgradeCore(index, 1);
          break;
        }
        case min_item.cache: {
          ns.tprint("upgrade cache id:" + index);
          if (!ns.hacknet.upgradeCache(index, 1)) {
            ns.tprint("failed to upgrade cache id:" + index);
          }
          break;
        }


      }
      /*
      if (min == min_item.level) {
        ns.tprint("upgrade level id:" + index);
        ns.hacknet.upgradeLevel(index, 1);
      } else if (min_item.ram == min) {
        ns.tprint("upgrade ram id:" + index);
        ns.hacknet.upgradeRam(index, 1);
      } else if (min == min_item.core) {
        ns.tprint("upgrade core id:" + index);
        ns.hacknet.upgradeCore(index, 1);
      } else if (min == min_item.cache) {
        ns.tprint("upgrade cache id:" + index);
        if (!ns.hacknet.upgradeCache(index, 1)) {
          ns.tprint("failed to upgrade cache id:" + index);
        }
      }

    }
  } while (can_try && limit-- > 0);
}

function find_min(costs) {
  costs.sort((a, b) => min_item_cost(a) - min_item_cost(b));
  return costs[0];
}

function min_item_cost(item) {
  return Math.min([item.level, item.cache, item.core, item.ram]);
}
