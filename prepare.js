/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const host = ns.getHostname();
    const money = ns.getServerMaxMoney(target);
    const sec = ns.getServerMinSecurityLevel(target);
    while (ns.getServerMoneyAvailable(target) < .95 * money) {
        const ram = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        const max_threads = ram / 3.5;
        let money_needed = money - ns.getServerMoneyAvailable(target);
        let threads = Math.max(max_threads, ns.growthAnalyze(target, money / money_needed));
        if(threads)
        ns.exec("/scripts/basics/grow.js", host, threads, target, 0,0);
        await ns.sleep(60000);
    }
    while (ns.getServerSecurityLevel(target) > sec) {
        const ram = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        const max_threads = ram / 3.5;
        let threads = Math.max(max_threads, (ns.getServerSecurityLevel(target) - sec) / 0.05);
        if(threads)
        ns.exec("/scripts/basics/weaken.js", host, threads, target, 0,0);
        await ns.sleep(60000);
    }
    killall()
}