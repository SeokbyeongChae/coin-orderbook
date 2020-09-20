import Big from "big.js";
import Util from "../common/util";
import { OrderType, ExchangeId } from "../common/constants";

export default class OrderBookManager {
  orderBookMap: Map<string, OrderBook> = new Map();

  config: any;
  orderBookDepth: number;

  constructor(config: any) {
    this.config = config;
    this.orderBookDepth = this.config.orderBookDepth;
  }

  public updateOrderBookByDataset(dataset: OrderBookDataset): any {
    const market = `${dataset.baseAsset}/${dataset.quoteAsset}`;

    let marketOrderBookMap = this.orderBookMap.get(market);
    if (!marketOrderBookMap) {
      marketOrderBookMap = new OrderBook(this.orderBookDepth);
      this.orderBookMap.set(market, marketOrderBookMap);
    }

    return marketOrderBookMap.updateOrderBookByDataset(dataset);
  }

  public getDepthFitableOrderBookMap() {
    const result = [];
    for (const [market, orderBook] of this.orderBookMap) {
      result.push({
        market: market,
        ask: orderBook.getFitableOrderBookList(OrderType.ask),
        bid: orderBook.getFitableOrderBookList(OrderType.bid)
      });
    }

    return result;
  }

  public getOrderBookMap(): Map<string, OrderBook> {
    return this.orderBookMap;
  }

  public getOrderBook(baseAsset: string, quoteAsset: string): OrderBook | undefined {
    return this.orderBookMap.get(`${baseAsset}/${quoteAsset}`);
  }
}

export class OrderBook {
  askMap: any = Util.createAscSortedMap();
  bidMap: any = Util.createDescSortedMap();
  depth: number;

  constructor(depth: number) {
    this.depth = depth;
  }

  public updateOrderBookByDataset(dataset: OrderBookDataset): any {
    const orderBookMap = this.getOrderBookMap(dataset.orderType);

    for (const item of dataset.dataList) {
      if (item.bgAmount) {
        let orderBookItem = orderBookMap.get(item.bgPrice);
        if (!orderBookItem) {
          orderBookItem = new OrderBookItem(item.bgPrice);
          orderBookMap.set(item.bgPrice, orderBookItem);
        }

        orderBookItem.updateAmount(dataset.exchangeId, item.bgAmount);
      } else {
        const orderBookItem = orderBookMap.get(item.bgPrice);
        if (!orderBookItem) continue;

        orderBookItem.removeExchange(dataset.exchangeId);
        if (orderBookItem.isEmpty()) {
          orderBookMap.delete(item.bgPrice);
        }
      }
    }

    return this.getFitableOrderBookList(dataset.orderType);
  }

  public getOrderBookMap(orderType: OrderType): any {
    return orderType === OrderType.ask ? this.askMap : this.bidMap;
  }

  public getFitableOrderBookList(orderType: OrderType) {
    const orderBookMap = this.getOrderBookMap(orderType);
    return orderBookMap.toArray().slice(0, this.depth);
  }
}

class OrderBookItem {
  bgPrice: Big;
  totalAmount: Big = new Big(0);
  exchangeList: Map<ExchangeId, Big> = new Map();

  constructor(bgPrice: Big) {
    this.bgPrice = bgPrice;
  }

  updateAmount(exchangeId: ExchangeId, bgAmount: Big) {
    const bgExchangeAmount = this.exchangeList.get(exchangeId);
    if (bgExchangeAmount) {
      this.totalAmount = this.totalAmount.minus(bgExchangeAmount).plus(bgAmount);
    } else {
      this.totalAmount = this.totalAmount.plus(bgAmount);
    }
    this.exchangeList.set(exchangeId, bgAmount);
  }

  removeExchange(exchangeId: ExchangeId) {
    const bgExchangeAmount = this.exchangeList.get(exchangeId);
    if (!bgExchangeAmount) return;

    this.totalAmount = this.totalAmount.minus(bgExchangeAmount);
    this.exchangeList.delete(exchangeId);
  }

  getTotalAmount() {
    return this.totalAmount;
  }

  getExchangeCount(): number {
    return this.exchangeList.size;
  }

  isEmpty(): boolean {
    return this.exchangeList.size === 0;
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
