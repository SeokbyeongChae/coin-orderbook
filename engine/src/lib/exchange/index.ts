import { TypedEmitter } from "tiny-typed-emitter";
import Engine from "@src/lib/engine";
import { OrderBookDatasetItem, OrderBookDataset, OrderType } from "@src/lib/order_book";

import { ExchangeEvents } from "./type"
export * from './type'

export default abstract class Exchange extends TypedEmitter<ExchangeEvents> {
  protected engine: Engine;
  protected config: any;
  protected id: number;
  protected endPoint: string;
  protected exchangeConfig: any;

  constructor(engine: Engine, config: any, exchangeConfig: any) {
    super();

    this.engine = engine;
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

    this.engine.updateOrderBookByDataset(orderDataset);
  }
}