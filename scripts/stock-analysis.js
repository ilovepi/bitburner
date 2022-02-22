/** @param {import(".").NS } ns */
export async function main(ns) {
  let st = ns.stock;
  let stocks = st.getSymbols();
  let data = {};
  for (let s of stocks) {
    let pos = st.getPosition(s);
    data[s] = {
      max_shares: st.getMaxShares(s),
      price: st.getPrice(s),
      forcast: st.getForecast(s),
      pos: pos,
      long: st.getSaleGain(s, pos[0], "Long"),
      short: st.getSaleGain(s, pos[3], "Short"),
      volatility: st.getVolatility(s),
    };
  }
  data.sort;

  let s = JSON.stringify(
    data,
    function (k, v) {
      if (v instanceof Array) {
        return JSON.stringify(v);
      }
      return v;
    },
    1,
  );
  ns.tprint(s);
  ns.tprint(data["JGN"]);
}

function max(dict, f) {
  let keys = Object.keys(dict);
  keys.sort(f);
  return [keys[0], dict[keys[0]]];
}
