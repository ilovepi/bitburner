// // try to open every port we can
// function breakPorts(ns, hostname) {
// 	const home = "home"
// 	if (ns.fileExists("BruteSSH.exe", home))
// 		ns.brutessh(hostname);
// 	if (ns.fileExists("FTPCrack.exe", home))
// 		ns.ftpcrack(hostname);
// 	if (ns.fileExists("relaySMTP.exe", home))
// 		ns.relaysmtp(hostname);
// 	if (ns.fileExists("HTTPWorm.exe", home))
// 		ns.httpworm(hostname);
// 	if (ns.fileExists("SQLInject.exe", home))
// 		ns.sqlinject(hostname);
//}

/** @param {NS} ns **/
export async function main(ns) {
	var target = "joesguns";
	var threads = ns.args[1];
	var moneyThresh = ns.getServerMaxMoney(target) * 0.75;
	var securityThresh = ns.getServerMinSecurityLevel(target) + 5;
	if (moneyThresh < 10)
		return;

	//	breakPorts(ns, target);
	//	ns.nuke(target);
	while (true) {
		if (ns.getServerSecurityLevel(target) > securityThresh) {
			await ns.weaken(target, threads);
		} else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
			await ns.grow(target, threads);
		} else {
			await ns.hack(target, threads);
		}
	}
}