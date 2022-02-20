/** @param {NS} ns **/
export async function main(ns) {
    var servers = JSON.parse(ns.read("server.json"));
    var max = servers[0];
    for(const a of servers){
        if(a.can_hack && a.score > max.score){
            max = a;
        }
    }

    ns.tprint(max);


}