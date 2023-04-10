/** @param {import(".").NS } ns */
export async function main(ns) {
  const host = "joesguns";
  let cur = new Date().getTime();
  while (true) {
    const max_money = ns.getServerMaxMoney(host);
    const money = ns.getServerMoneyAvailable(host);
    const now = new Date().getTime();
    const ts = now - cur;
    cur = now;
    let percent = (money / max_money) ;
    let sec = ns.getServerSecurityLevel(host);
    let min_sec = ns.getServerMinSecurityLevel(host);
    var s = Number(percent).toLocaleString(undefined, {
      style: "percent",
      minimumFractionDigits: 2,
    });
    ns.tprint(
      `${host}: { Security: ${sec - min_sec} Percent: ${s}  Time: ${ts} }`
    );
    await ns.sleep(100);
  }
}
