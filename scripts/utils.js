/** @param {import(".").NS } ns */
export async function find_all_servers(ns) {
	var visited = [];
	var worklist = [ns.getHostname()];
	while (worklist.length != 0) {
		let target = worklist.pop();
		visited.push(target);
		let adjacent = ns.scan(target);
		for (const host of adjacent) {
			if (visited.includes(host)) {
				continue;
			} else {
				worklist.push(host);
			}
		}
	}
	return visited;
}

/** @param {import(".").NS } ns */
export function breakPorts(ns, hostname) {
// try to open every port we can
	const home = "home"
	if (ns.fileExists("BruteSSH.exe", home))
		ns.brutessh(hostname);
	if (ns.fileExists("FTPCrack.exe", home))
		ns.ftpcrack(hostname);
	if (ns.fileExists("relaySMTP.exe", home))
		ns.relaysmtp(hostname);
	if (ns.fileExists("HTTPWorm.exe", home))
		ns.httpworm(hostname);
	if (ns.fileExists("SQLInject.exe", home))
		ns.sqlinject(hostname);
}

/** @param {import(".").NS } ns */
export async function port_count(ns) {
	const home = "home";
	var count = 0;
	let files = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
	for (const f of files) {
		if (ns.fileExists(f, home))
			count++;
	}
	return count;
}


/** @param {import(".").NS } ns */
export async function can_hack(ns, target) {
	let rootable = await can_root(ns, target);
	const hacking_ability = ns.getHackingLevel();
	const required_level = ns.getServerRequiredHackingLevel(target);
    return (required_level < hacking_ability) && rootable;
}


/** @param {import(".").NS } ns */
export async function can_root(ns, target) {
	const ports = ns.getServerNumPortsRequired(target);
	return ports <= await port_count(ns);
}