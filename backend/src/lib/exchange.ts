import { TypedEmitter } from "tiny-typed-emitter";
import Quant from "../quant";
import WSConnector from "./wsConnector";
import { OrderType } from "../common/constants";
import { OrderBookDatasetItem, OrderBookDataset } from "./orderBook";

export enum ExchangeStatuses {
  idle = 1,
  initialized = 2,
  running = 3,
  disconnected = 4
}

interface ExchangeEvents {
  /*
  initialized: (success: boolean) => void;
  started: (success: boolean) => void;
  disconnected: (error: any) => void;
  */
  updateStatus: (status: ExchangeStatuses) => void;
  updateOrderBookByDataset: () => void;
  updateOrderBook: () => void;
}

export default abstract class Exchange extends TypedEmitter<ExchangeEvents> {
  // wsConnector: WSConnector;
  quant: Quant;
  config: any;
  exchangeConfig: any;
  id: number;
  endPoint: string;

  constructor(quant: Quant, config: any, exchangeConfig: any) {
    super();

    this.quant = quant;
    this.config = config;
    this.exchangeConfig = exchangeConfig;
    this.id = this.exchangeConfig.id;
    this.endPoint = this.exchangeConfig.endPoint;
    // this.wsConnector = wsConnector ? wsConnector : new WSConnector(exchangeConfig.wsUrl);
  }

  abstract init(): void;
  abstract start(): void;
  abstract stop(): void;

  protected updateOrderBookByDataset(
    baseAsset: string,
    quoteAsset: string,
    exchangeId: number,
    orderType: OrderType,
    dataList: OrderBookDatasetItem[]
  ) {
    const orderDataset: OrderBookDataset = {
      baseAsset,
      quoteAsset,
      exchangeId,
      orderType,
      dataList
    };

    this.quant.updateOrderBookByDataset(orderDataset);
  }
}
/*
export default abstract class Exchange EventEmitter {
  abstract init(): boolean;
  abstract start(): boolean;
  abstract stop(): boolean;
}
*/
