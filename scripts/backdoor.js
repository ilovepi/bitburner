import { can_hack } from "/scripts/utils.js";

const max_depth = 100;

/**
 * @param {import(".").NS } ns
 */
export async function main(ns) {
  let visited = [];
  let path = [];
  let path_map = new Map();
  await DFS(ns, ns.getHostname(), visited, path, path_map, max_depth);

  for (const [host, path] of path_map.entries()) {
    if (ns.getServer(host).backdoorInstalled) continue;
    if (await can_hack(ns, host)) {
      // connect to target
      connect(ns, path);
      await ns.singularity.installBackdoor();
      // come back to where we started
      connect(ns, path.slice().reverse());
    }
  }
}

/**
 * @param {import(".").NS } ns
 * @param {[string]} path
 */
function connect(ns, path) {
  for (let p of path) {
    ns.singularity.connect(p);
  }
}

/**
 * @param {import(".").NS } ns
 * @param {string} target
 * @param {[string]} visited
 * @param {[string]} worklist
 * @param {Map<string,[string]>} path
 */
async function visit(ns, target, visited, worklist, path) {
  if (!ns.getServer(host).backdoorInstalled && (await can_hack(ns, target))) {
    await ns.singularity.installBackdoor();
  }
  visited.push(target);
  path[target].push(target);

  let adjacent = ns.scan(target);
  for (let a of adjacent) {
    if (visited.includes(a)) {
      continue;
    }
    worklist.push(a);
  }
}

/**
 * @param {import(".").NS } ns
 * @param {string} target
 * @param {[string]} visited
 * @param {[string]} worklist
 * @param {[string]} path
 * @param {Map<string,[string]>} path_map
 */
async function DFS(ns, node, visited, path, path_map, depth) {
  if (depth == 0) {
    ns.tprint("Error: Hit max depth limit!");
    exit(-1);
  }
  visited.push(node);
  path.push(node);
  path_map.set(node, [...path]);
  let adjacent = ns.scan(node);
  for (let a of adjacent) {
    if (visited.includes(a)) {
      continue;
    }
    await DFS(ns, a, visited, path, path_map, depth - 1);
  }
  path.pop(1);
}
