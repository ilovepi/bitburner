import { my_min_ram } from "/scripts/servers/server.js";

/** @param {import("..").NS } ns */
export async function main(ns) {
    ns.tprint(my_min_ram(ns));
}
