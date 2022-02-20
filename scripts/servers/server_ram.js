/** @param {NS} ns **/
export async function main(ns) {
   const my_money = ns.getServerMoneyAvailable("home");
   ns.tprintf("Available $%d", my_money);
   const per_server = my_money / 25;

   ns.tprintf("Per Server $%d", per_server);
   var max_ram = ns.getPurchasedServerMaxRam();
   ns.tprintf("Max Ram: %d", max_ram);
   const my_ram = my_max_ram(ns);
   ns.tprintf("My Max Ram: %d", my_ram);


   var cost = 0;
   while (max_ram > my_ram) {
      cost = ns.getPurchasedServerCost(max_ram);
      if (per_server < cost)
         max_ram = max_ram / 2;
      else {
         ns.tprintf("Max Ram Upgrade: %d for $%d", max_ram, cost);
         break;
      }
   }
   if (max_ram <= my_ram) {
      ns.tprintf("Max Ram is not upgradable. Ram: %d, Cost: $%d", max_ram, cost);
      return;
   }
   const servers = ns.getPurchasedServers();
   var i = 0;
   for (const s of servers) {
      ns.killall(s);
      ns.deleteServer(s);
      ns.tprintf("Deleted server: %s", s);
      ns.purchaseServer("s" + i, max_ram);
      ns.tprintf("Purchased server: %s with %d", "s" + i, max_ram);
      i++;
   }

   let n = ns.getPurchasedServerLimit();

   while (i != n) {
      ns.purchaseServer("s" + i++, max_ram);
   }
   // ns.exec("distribute_exploit.js", "home");
}

/** @param {NS} ns **/
function my_max_ram(ns) {
   var max = 0;
   const servers = ns.getPurchasedServers();
   for (const s of servers) {
      var ram = ns.getServerMaxRam(s);
      if (ram > max)
         max = ram;
   }
   return max
}