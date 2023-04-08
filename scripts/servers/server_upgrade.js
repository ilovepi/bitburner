/** @param {import("..").NS } ns */
export async function main(ns) {
    const max_ram = ns.getPurchasedServerMaxRam();
    var server_list = ns.getPurchasedServers();
    ns.tprint(server_list);
    ns.tprintf("Max Ram: %d", max_ram);
    ns.tprintf("Max Ram cost: %d", ns.getPurchasedServerCost(max_ram));

    for (const s of server_list) {
    }

}