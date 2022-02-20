/** @param {NS} ns **/
export async function main(ns) {
	// grow.js [target] [sleep] [-l] [id]
	do{
		await ns.sleep(ns.args[1]);
		await ns.grow(ns.args[0]);
	}
	while (ns.args[2] == "-l") ;
}