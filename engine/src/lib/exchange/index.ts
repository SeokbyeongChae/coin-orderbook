import { TypedEmitter } from "tiny-typed-emitter";
import Quant from "@src/quant";
import { OrderBookDatasetItem, OrderBookDataset, OrderType } from "@src/lib/order_book";

import { ExchangeEvents } from "./type"
export * from './type'

export default abstract class Exchange extends TypedEmitter<ExchangeEvents> {
  protected quant: Quant;
  protected config: any;
  protected id: number;
  protected endPoint: string;
  public exchangeConfig: any;

  constructor(quant: Quant, config: any, exchangeConfig: any) {
    super();

    this.quant = quant;
    this.config = config;
    this.exchangeConfig = exchangeConfig;
    this.id = this.exchangeConfig.id;
    this.endPoint = this.exchangeConfig.endPoint;
  }

  abstract init(): void;
  abstract start(): void;
  abstract stop(): void;

  public isEnabled(): boolean {
    return this.exchangeConfig.enabled;
  }

  protected updateOrderBookByDataset(
    baseAsset: string,
    quoteAsset: string,
    orderType: OrderType,
    dataList: OrderBookDatasetItem[]
  ) {
    const orderDataset: OrderBookDataset = {
      baseAsset,
      quoteAsset,
      orderType,
      dataList,
      exchangeId: this.id
    };

    this.quant.updateOrderBookByDataset(orderDataset);
  }
}