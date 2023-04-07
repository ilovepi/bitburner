/** @param {import(".").NS } ns */
function myMoney(ns) {
  return ns.getServerMoneyAvailable("home");
}

/** @param {import("..").NS } ns */
export async function main(ns) {
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("sleep");

  var cnt = 9;

  while (hacknet.numNodes() < cnt) {
    res = hacknet.purchaseNode();
    print("Purchased hacknet Node with index " + res);
  }

  for (var i = 0; i < cnt; i++) {
    while (hacknet.getNodeStats(i).level < 100) {
      var cost = hacknet.getLevelUpgradeCost(i, 10);
      while (myMoney(ns) < cost) {
        print("Need $" + cost + " . Have $" + myMoney());
        sleep(3000);
      }
      res = hacknet.upgradeLevel(i, 10);
    }
  }

  print("All nodes upgraded to level 100");

  for (var i = 0; i < cnt; i++) {
    while (hacknet.getNodeStats(i).ram < 16) {
      var cost = hacknet.getRamUpgradeCost(i, 2);
      while (myMoney() < cost) {
        print("Need $" + cost + " . Have $" + myMoney());
        sleep(3000);
      }
      res = hacknet.upgradeRam(i, 2);
    }
  }

  print("All nodes upgraded to 16GB RAM");

  for (var i = 0; i < cnt; i++) {
    while (hacknet.getNodeStats(i).cores < 8) {
      var cost = hacknet.getCoreUpgradeCost(i, 1);
      while (myMoney() < cost) {
        print("Need $" + cost + " . Have $" + myMoney());
        sleep(3000);
      }
      res = hacknet.upgradeCore(i, 1);
    }
  }

  print("All nodes upgraded to 8 cores");
}