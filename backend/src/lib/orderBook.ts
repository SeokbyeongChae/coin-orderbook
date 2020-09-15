import Big from "big.js";
import Util from "../common/util";
import { OrderType, ExchangeId } from "../common/constants";

/**
 * dataset: [price: string, {totalAmount: string, exchangeList: array}]
 *
 */

export default class OrderBookManager {
  orderBookMap: Map<string, OrderBook> = new Map();

  constructor() {}

  initOrderBook(baseMarket: string, quoteMarket: string, orderType: OrderBook, dataset: any) {
    const market = `${baseMarket}/${quoteMarket}`;
    const orderBook = new OrderBook();
    this.orderBookMap.set(market, orderBook);
  }

  udateOrderBook() {}

  getOrderBooK() {}
}

class OrderBook {
  askMap: any = Util.createDescSortedMap();
  bidMap: any = Util.createAscSortedMap();

  constructor() {}

  initOrderBookByDataset(orderType: OrderType, dataset: any) {
    const orderBookMap = this.getOrderBookMap(orderType);
    for (const orderBookItem of dataset) {
      orderBookMap.set(new Big(orderBookItem[0]), {
        totalAmount: orderBookItem[1].totalAmount,
        exchangeList: orderBookItem[1].exchangeList
      });
    }
  }

  updateOrderBookByDataset(orderType: OrderType, dataset: any) {}

  getOrderBookMap(orderType: OrderType) {
    return orderType === OrderType.ask ? this.askMap : this.bidMap;
  }
}
