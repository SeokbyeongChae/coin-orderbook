import OrderBookManafer, { OrderBookDataset } from "./lib/orderBook";
import Binance from "./exchanges/binance";
import Coinbase from "./exchanges/coinbase";
import Bitfinex from "./exchanges/bitfinex";
import Exchange, { ExchangeStatuses } from "./lib/exchange";
import config from "../config/config.json";
import { OrderType, ExchangeId } from "./common/constants";
import { IPC } from "node-ipc";
import MarketManager from "./lib/marketManager";

export default class Quant {
  config: any;

  orderBookManager: OrderBookManafer;

  exchangeMap: Map<ExchangeId, Exchange> = new Map();

  private ipc = new IPC();
  private processSet: Set<any> = new Set();
  private marketManager: MarketManager = new MarketManager();

  constructor(config: any) {
    this.config = config;

    this.orderBookManager = new OrderBookManafer(this.config);

    const binanceExchange = new Binance(this, this.config, this.config.exchanges.binance);
    this.exchangeMap.set(ExchangeId.binance, binanceExchange);

    const bitfinexExchange = new Bitfinex(this, this.config, this.config.exchanges.bitfinex);
    this.exchangeMap.set(ExchangeId.bitfinex, bitfinexExchange);

    const coinbaseExchage = new Coinbase(this, this.config, this.config.exchanges.coinbase);
    this.exchangeMap.set(ExchangeId.coinbase, coinbaseExchage);

    this.ipc.config.id = "engine";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;
  }

  public startPipeline() {
    this.ipc.serve(() => {
      this.ipc.server.on("connect", (socket: any) => {
        this.processSet.add(socket);
        console.log(this.processSet.size);
      });

      this.ipc.server.on("socket.disconnected", (socket: any) => {
        this.processSet.delete(socket);
        console.log(this.processSet.size);
      });

      this.ipc.server.on("marketList", (data: any, socket: any) => {
        const marketList = this.marketManager.getMarketList();
        this.ipc.server.emit(socket, "marketList", marketList);
      });

      this.ipc.server.on("orderBook", (data: any, socket: any) => {
        const snapshot = this.orderBookManager.getDepthFitableOrderBookMap();
        this.ipc.server.emit(socket, "orderBook", snapshot);
      });
    });

    this.ipc.server.start();
  }

  private broadcastEngineMessage(method: string, data: any) {
    for (const socket of this.processSet) {
      this.ipc.server.emit(socket, method, data);
    }
  }

  public start() {
    for (const [exchangeId, exchange] of this.exchangeMap) {
      if (!exchange.exchangeConfig.enabled) continue;

      exchange.on("updateStatus", status => {
        switch (status) {
          case ExchangeStatuses.idle: {
            break;
          }
          case ExchangeStatuses.initialized: {
            exchange.start();
            break;
          }
          case ExchangeStatuses.running: {
            break;
          }
          case ExchangeStatuses.disconnected: {
            exchange.stop();
            this.orderBookManager.removeOrderBookByExchangeId(exchangeId);
            exchange.start();
            break;
          }
        }
      });

      exchange.init();
    }
  }

  public updateOrderBookByDataset(orderBookDataset: OrderBookDataset) {
    const depthFairOrderBook = this.orderBookManager.updateOrderBookByDataset(orderBookDataset);
    if (!depthFairOrderBook) return;

    const data = {
      baseAsset: orderBookDataset.baseAsset,
      quoteAsset: orderBookDataset.quoteAsset,
      orderType: orderBookDataset.orderType,
      data: depthFairOrderBook
    };

    this.broadcastEngineMessage("updateOrderBook", data);
  }

  public removeOrderBookByExchangeId(exchangeId: ExchangeId) {
    this.orderBookManager.removeOrderBookByExchangeId(exchangeId);
  }

  public updateMarketList(exchangeId: ExchangeId, marketList: string[]) {
    this.marketManager.updateMarketList(exchangeId, marketList);
    this.broadcastEngineMessage("marketList", this.marketManager.getMarketList());
  }

  public addMarketList(exchangeId: ExchangeId, baseAsset: string, quoteAsset: string) {
    this.marketManager.addMarketList(exchangeId, baseAsset, quoteAsset);

    this.broadcastEngineMessage("marketList", this.marketManager.getMarketList());
  }

  public removeAllMarketByExchangeId(exchangeId: ExchangeId) {
    this.marketManager.removeAllMarketByExchangeId(exchangeId);
  }

  public isQuoteAsset(asset: string): boolean {
    const index = this.config.quoteAssetList.findIndex((x: string) => x === asset);
    return index !== -1;
  }

  public isBaseAsset(asset: string): boolean {
    const index = this.config.baseAssetList.findIndex((x: string) => x === asset);
    return index !== -1;
  }

  public isAvailableMarket(baseAsset: string, quoteAsset: string) {
    return this.isBaseAsset(baseAsset) && this.isQuoteAsset(quoteAsset);
  }
}

const quant = new Quant(config);
quant.startPipeline();
quant.start();

// const streamServer = new StreamServer(quant);
