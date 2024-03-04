import Big from "big.js";
import ExchangeSortedMap, { SortedMapType } from "@src/lib/exchange_sorted_map";
import { TypedEmitter } from "tiny-typed-emitter";

import { OrderType, OrderBookManagerEvents } from "./type";
export * from "./type"

export default class OrderBookManager extends TypedEmitter<OrderBookManagerEvents> {
  private orderBookMap: Map<string, OrderBook> = new Map();
  private config: any;
  private orderBookDepth: number;

  constructor(config: any) {
    super();

    this.config = config;
    this.orderBookDepth = this.config.orderBookDepth;
  }

  udateOrderBook(baseMarket: string, quoteMarket: string, orderType: OrderType, dataset: any) {
    const market = `${baseMarket}/${quoteMarket}`;

    let marketOrderBook = this.orderBookMap.get(market);
    if (!marketOrderBook) {
      marketOrderBook = new OrderBook(this.orderBookDepth);
      this.orderBookMap.set(market, marketOrderBook);
    }

    marketOrderBook.updateOrderBookByDataset(orderType, dataset);
    this.emit("updateOrderBook", {
      market,
      marketOrderBook
    });
  }

  getOrderBooK(baseMarket: string, quoteMarket: string): OrderBook | undefined {
    return this.orderBookMap.get(`${baseMarket}/${quoteMarket}`);
  }
}

class OrderBook {
  private askMap = new ExchangeSortedMap(SortedMapType.Asc)
  private bidMap = new ExchangeSortedMap(SortedMapType.Desc)
  private depth: number;

  constructor(depth: number) {
    this.depth = depth;
  }

  public updateOrderBookByDataset(orderType: OrderType, dataset: any) {
    const orderMap = this.getMap(orderType);
    for (const data of dataset) {
      const bgPrice = new Big(data.bgPrice);
      const bgAmount = new Big(data.totalAmount);
      let orderBookItem = orderMap.get(bgPrice);
      if (!orderBookItem) {
        orderBookItem = new OrderBookItem(bgPrice, bgAmount, data.exchangeList);
        orderMap.set(bgPrice, orderBookItem);
      } else {
        orderBookItem.update(bgAmount, data.exchangeList);
      }
    }

    for (const [bgPrice, orderBookItem] of orderMap.entriesArray()) {
      if (!orderBookItem.updated) {
        orderMap.delete(bgPrice);
      } else {
        orderBookItem.updated = false;
      }
    }
  }

  public getMap(orderType: OrderType) {
    return orderType === OrderType.ask ? this.askMap : this.bidMap;
  }
}

class OrderBookItem {
  bgPrice: Big;
  bgTotalAmount: Big;
  exchangeList: [];
  updated: boolean;

  constructor(bgPrice: Big, bgTotalAmount: Big, exchangeList: []) {
    this.bgPrice = bgPrice;
    this.bgTotalAmount = bgTotalAmount;
    this.exchangeList = exchangeList;
    this.updated = true;
  }

  public update(bgTotalAmount: Big, exchangeList: []) {
    this.bgTotalAmount = bgTotalAmount;
    this.exchangeList = exchangeList;
    this.updated = true;
  }
}

