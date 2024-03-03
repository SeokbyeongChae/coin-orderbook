import axios from "axios";

export default class Api {
  static request = async (option: any): Promise<any[]> => {
    try {
      const result = await axios(option);
      return [undefined, result];
    } catch (err) {
      return [err, undefined];
    }
  };
}
