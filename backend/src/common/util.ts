import Big from "big.js";
import axios from "axios";

const SortedMap = require("collections/sorted-map");

export default class Util {
  static asc = (a: Big, b: Big) => {
    return a.cmp(b);
  };

  static desc = (a: Big, b: Big) => {
    return b.cmp(a);
  };

  static equal = (a: Big, b: Big) => {
    return a.eq(b);
  };

  static createDescSortedMap = (): any => {
    return new SortedMap(null, Util.equal, Util.desc);
  };

  static createAscSortedMap = (): any => {
    return new SortedMap(null, Util.equal, Util.asc);
  };

  static request = async (option: any): Promise<any[]> => {
    try {
      const result = await axios(option);
      return [undefined, result];
    } catch (err) {
      return [err, undefined];
    }
  };
}
