export class ServerData {
  /**
   * @param {string} hostname
   * @param {boolean} is_rooted
   * @param {boolean} can_hack
   * @param {Number} ram
   * @param {Number} max_money
   * @param {Number} cur_money
   * @param {Number} target_money
   * @param {Number} min_sec
   * @param {Number} cur_sec
   * @param {Number} hack_rate
   * @param {Number} hack_chance
   * @param {Number} t_h
   * @param {Number} hack_cost
   * @param {Number} hack_time
   * @param {Number} growth
   * @param {Number} grow_time
   * @param {Number} t_g_i
   * @param {Number} t_g
   * @param {Number} sec_g_i
   * @param {Number} sec_g
   * @param {Number} weaken_value
   * @param {Number} weaken_time
   * @param {Number} t_w_i
   * @param {Number} t_w_g_i
   * @param {Number} t_w_g
   * @param {Number} t_w_h
   */
  constructor(
    hostname,
    is_rooted,
    can_hack,
    ram,
    max_money,
    cur_money,
    target_money,
    min_sec,
    cur_sec,
    hack_rate,
    hack_chance,
    t_h,
    hack_cost,
    hack_time,
    growth,
    grow_time,
    t_g_i,
    t_g,
    sec_g_i,
    sec_g,
    weaken_value,
    weaken_time,
    t_w_i,
    t_w_g_i,
    t_w_g,
    t_w_h
  ) {
    this.name = hostname;
    this.is_rooted = is_rooted;
    this.can_hack = can_hack;
    this.ram = ram;
    this.max_money = max_money;
    this.cur_money = cur_money;
    this.target_money = target_money;
    this.min_sec = min_sec;
    this.cur_sec = cur_sec;
    this.hack_rate = hack_rate;
    this.hack_chance = hack_chance;
    this.t_h = t_h;
    this.hack_cost = hack_cost;
    this.hack_time = hack_time;
    this.growth = growth;
    this.grow_time = grow_time;
    this.t_g_i = t_g_i;
    this.t_g = t_g;
    this.sec_g_i = sec_g_i;
    this.sec_g = sec_g;
    this.weaken_val = weaken_value;
    this.weaken_time = weaken_time;
    this.t_w_i = t_w_i;
    this.t_w_g_i = t_w_g_i;
    this.t_w_g = t_w_g;
    this.t_w_h = t_w_h;
  }
}
