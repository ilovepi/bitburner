/** @param {NS} ns **/
export async function main(ns) {
	// hack.js [target] [sleep] [-l] [id]
	let loop = ns.args.length > 2 && ns.args[2] === "-l";
	do {
		await ns.sleep(ns.args[1]);
		await ns.hack(ns.args[0]);
	} while (loop);
}