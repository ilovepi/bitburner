/** @param {NS} ns **/
export async function main(ns) {
    var can_try = true;
    while (can_try) {
        var money = ns.getServerMoneyAvailable("home");
        var machine_count = ns.hacknet.numNodes();
        ns.tprintf("Available Money: %d\n", money);

        ns.tprintf("HackNet Machine Count: %d\n", machine_count);
        let costs = [];
        for (let i = 0; i < machine_count; i++) {
            var p = ns.hacknet.getNodeStats(i);
            //ns.tprint(p);
            var level = ns.hacknet.getLevelUpgradeCost(i);
            var ram = ns.hacknet.getRamUpgradeCost(i);
            var core = ns.hacknet.getCoreUpgradeCost(i);
            var min_cost = Math.min(level, ram, core);
            costs.push(min_cost);
            // var base = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram, p.cores);
            // var level = ns.formulas.hacknetNodes.moneyGainRate(p.level + 1, p.ram, p.cores);
            // var ram = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram + 1, p.cores);
            // var cores = ns.formulas.hacknetNodes.moneyGainRate(p.level, p.ram, p.cores + 1);

            // ns.tprintf("base = %f", base);
            // ns.tprintf("level = %f", level);
            // ns.tprintf("ram = %f", ram);
            // ns.tprintf("cores = %f", cores);
        }

ns.tprint(costs);
        var min = Math.min(...costs);

        const node_cost = ns.hacknet.getPurchaseNodeCost();
ns.tprint(node_cost);
        if (node_cost < min) {
            if (money > node_cost)
                ns.hacknet.purchaseNode(1);
            else can_try = false;
        } else {
            if (money < min) {
                can_try = false;
                return;
            }
            const index = costs.indexOf(min);
            var level = ns.hacknet.getLevelUpgradeCost(index, 1);
            var ram = ns.hacknet.getRamUpgradeCost(index, 1);
            var core = ns.hacknet.getCoreUpgradeCost(index, 1);
            if (level < ram && level < core )
                ns.hacknet.upgradeLevel(index, 1);
            else if (ram < core )
                ns.hacknet.upgradeRam(index, 1);
            else
                ns.hacknet.upgradeCore(index, 1);
        }
    }
}