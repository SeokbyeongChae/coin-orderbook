
import Big from "big.js";
const SortedMap = require("collections/sorted-map");

import { SortedMapType } from "./type"
export * from "./type"

export default class ExchangeSortedMap extends SortedMap {
  private static asc = (a: Big, b: Big) => {
    return a.cmp(b);
  };

  private static desc = (a: Big, b: Big) => {
    return b.cmp(a);
  };

  private static equal = (a: Big, b: Big) => {
    return a.eq(b);
  };
  
  constructor(type: SortedMapType) {
    const compareFunction = type === SortedMapType.Asc ? ExchangeSortedMap.asc : ExchangeSortedMap.desc;
    super(null, ExchangeSortedMap.equal, compareFunction);
  }
}