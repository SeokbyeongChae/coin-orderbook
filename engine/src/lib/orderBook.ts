import Big from "big.js";
import Util from "../common/util";
import { OrderType, ExchangeId } from "../common/constants";

export default class OrderBook {
  // askMap: any = Util.createDescSortedMap();
  // bidMap: any = Util.createAscSortedMap();
  askMap: Map<string, any> = new Map();
  bidMap: Map<string, any> = new Map();
  config: any;

  orderBookDepth: number;

  constructor(config: any) {
    this.config = config;
    this.orderBookDepth = this.config.orderBookDepth;
  }

  public updateOrderBookByDataset(dataset: OrderBookDataset): any[] | undefined {
    const market = `${dataset.baseAsset}/${dataset.quoteAsset}`;
    const marketOrderBookMap = this.getMarketOrderBookMap(dataset.orderType, market);

    const result = [];
    for (const item of dataset.dataList) {
      let orderBookItem = marketOrderBookMap.get(item.bgPrice);
      if (item.bgAmount) {
        if (!orderBookItem) {
          orderBookItem = new OrderBookItem();
          marketOrderBookMap.set(item.bgPrice, orderBookItem);
        }

        orderBookItem.updateAmount(dataset.exchangeId, item.bgAmount);

        result.push([item.bgPrice, item.bgAmount]);
      } else {
        if (!orderBookItem)  return;

        orderBookItem.removeExchange(dataset.exchangeId);
        if (orderBookItem.isEmpty()) {
          marketOrderBookMap.delete(item.bgPrice);

          result.push([item.bgPrice, undefined]);
        }
      }
    }

    return result;
  }

  public getOrderBookMap(orderType: OrderType): any {
    return orderType === OrderType.ask ? this.askMap : this.bidMap;
  }

  public getMarketOrderBookMap(orderType: OrderType, market: string) {
    const orderBookMap = this.getOrderBookMap(orderType);
    if (orderBookMap.has(market)) {
      return orderBookMap.get(market);
    }

    const marketOrderBookMap = orderType === OrderType.ask ? Util.createDescSortedMap() : Util.createAscSortedMap();
    orderBookMap.set(market, marketOrderBookMap);
    return marketOrderBookMap;
  }

  /*
  public setMarketOrderBookMap(orderType: OrderType, market: string) {
    const orderBookMap = this.getOrderBookMap(orderType);
    if (orderBookMap.has(market)) {
      return orderBookMap.get(market);
    }

    const marketOrderBookMap = orderType === OrderType.ask ? Util.createDescSortedMap() : Util.createAscSortedMap();
    orderBookMap.set(market, marketOrderBookMap);
    return marketOrderBookMap;
	}
	*/
}

class OrderBookItem {
  totalAmount: Big = new Big(0);
  exchnageList: Map<ExchangeId, Big> = new Map();

  constructor() {}

  updateAmount(exchangeId: ExchangeId, bgAmount: Big) {
    const bgExchangeAmount = this.exchnageList.get(exchangeId);
    if (bgExchangeAmount) {
      this.totalAmount = this.totalAmount.minus(bgExchangeAmount).plus(bgAmount);
    } else {
      this.totalAmount = this.totalAmount.plus(bgAmount);
    }
    this.exchnageList.set(exchangeId, bgAmount);
  }

  removeExchange(exchangeId: ExchangeId) {
    const bgExchangeAmount = this.exchnageList.get(exchangeId);
    if (!bgExchangeAmount) return console.log("check...");

    this.totalAmount = this.totalAmount.minus(bgExchangeAmount);
    this.exchnageList.delete(exchangeId);
  }

  getTotalAmount() {
    return this.totalAmount;
  }

  getExchangeCount(): number {
    return this.exchnageList.size;
  }

  isEmpty(): boolean {
    return this.exchnageList.size === 0;
  }
}

export interface OrderBookDatasetItem {
  bgPrice: Big;
  bgAmount: Big | undefined;
}

export interface OrderBookDataset {
  exchangeId: ExchangeId;
  orderType: OrderType;
  baseAsset: string;
  quoteAsset: string;
  dataList: OrderBookDatasetItem[];
}

/*
const SortedMap = require("collections/sorted-map");
for (const [data, da] of testMap.entriesArray()) {
  console.dir(data.toString());
}
*/
