/** @param {NS} ns **/
export async function main(ns) {
    const host = ns.getHostname();
    const max_ram =ns.getServerMaxRam(host);
    const used_ram =ns.getServerUsedRam(host);
    const free_ram = max_ram - used_ram;
    const threads = Math.floor(free_ram/1.75);
    const target = ns.args[0];
    const max_money = ns.getServerMaxMoney(target);
    let val = ns.getServerMoneyAvailable(target);
    const growth = ns.getServerGrowth(target)
    let times_to_grow = 0;
    while(val < max_money){
        times_to_grow++;
        val += val*growth/100;
    }

ns.tprint(times_to_grow);



   // ns.exec("/script/basic/grow.js")
    //while(max_money != ns.getServerMoneyAvailable(target)){

    //}

}