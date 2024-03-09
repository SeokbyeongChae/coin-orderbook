import Big from "big.js";
import { ExchangeId } from "@src/lib/exchange";
import ExchangeSortedMap, { SortedMapType } from "@src/lib/exchange_sorted_map";

import { OrderType, OrderBookDataset } from "./type"
export * from "./type"

class OrderBookItem {
  private bgPrice: Big;
  private totalAmount: Big = new Big(0);
  private exchangeList: Map<ExchangeId, Big> = new Map();

  constructor(bgPrice: Big) {
    this.bgPrice = bgPrice;
  }


  public updateAmount(exchangeId: ExchangeId, bgAmount: Big) {
    const bgExchangeAmount = this.exchangeList.get(exchangeId);
    if (bgExchangeAmount) {
      this.totalAmount = this.totalAmount.minus(bgExchangeAmount).plus(bgAmount);
    } else {
      this.totalAmount = this.totalAmount.plus(bgAmount);
    }
    this.exchangeList.set(exchangeId, bgAmount);
  }

  public removeExchange(exchangeId: ExchangeId) {
    const bgExchangeAmount = this.exchangeList.get(exchangeId);
    if (!bgExchangeAmount) return;

    this.totalAmount = this.totalAmount.minus(bgExchangeAmount);
    this.exchangeList.delete(exchangeId);
    return this.exchangeList.size;
  }

  public getTotalAmount() {
    return this.totalAmount;
  }

  public getExchangeCount(): number {
    return this.exchangeList.size;
  }

  public isEmpty(): boolean {
    return this.exchangeList.size === 0;
  }
}

class OrderBook {
  private askMap = new ExchangeSortedMap(SortedMapType.Asc)
  private bidMap = new ExchangeSortedMap(SortedMapType.Desc)
  private depth: number;

  constructor(depth: number) {
    this.depth = depth;
  }

  public updateOrderBookByDataset(dataset: OrderBookDataset): OrderBookItem[] {
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

    return this.getOrderBookItemList(dataset.orderType);
  }

  public getOrderBookMap(orderType: OrderType) {
    return orderType === OrderType.Ask ? this.askMap : this.bidMap;
  }

  public getOrderBookItemList(orderType: OrderType): OrderBookItem[] {
    const orderBookMap = this.getOrderBookMap(orderType);
    return orderBookMap.toArray().slice(0, this.depth);
  }

  public removeOrderBookByExchangeId(exchangeId: ExchangeId, orderType: OrderType) {
    const orderBookMap = this.getOrderBookMap(orderType);
    for (const [bgPrice, orderBookItem] of orderBookMap.entries()) {
      const resultCnt = orderBookItem.removeExchange(exchangeId);
      if (resultCnt === 0) orderBookMap.delete(bgPrice);
    }
  }
}

export default class OrderBookManager {
  private orderBookMap: Map<string, OrderBook> = new Map();

  private config: any;
  private orderBookDepth: number;

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

  public removeOrderBookByExchangeId(exchangeId: ExchangeId) {
    for (const [market, orderBook] of this.orderBookMap) {
      orderBook.removeOrderBookByExchangeId(exchangeId, OrderType.Ask);
      orderBook.removeOrderBookByExchangeId(exchangeId, OrderType.Bid);
    }
  }

  public getOrderBookList() {
    const result = [];
    for (const [market, orderBook] of this.orderBookMap) {
      result.push({
        market: market,
        ask: orderBook.getOrderBookItemList(OrderType.Ask),
        bid: orderBook.getOrderBookItemList(OrderType.Bid)
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