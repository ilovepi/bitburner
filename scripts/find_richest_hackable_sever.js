// @ts-ignore
import {find_all_servers, can_hack} from  "/scripts/utils.js";

/** @param {import(".").NS} ns **/
export async function main(ns) {
	let visited = await find_all_servers(ns);
	var max_money = 0;
	var max_server = visited[0];

	for (const s of visited) {
		if (await can_hack(ns, s)) {
			var money = ns.getServerMaxMoney(s);
			if (money > max_money) {
				max_money = money;
				max_server = s;
			}

		}
	}

	ns.tprintf("Should target %s for $%f\n", max_server, max_money);
}