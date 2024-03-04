import OrderBookManager, { OrderBookDataset } from "@src/lib/order_book";
import Exchange, { ExchangeStatus } from "@src/lib/exchange";
import { ExchangeId } from "@src/common/constants";
import MarketManager from "@src/lib/market_manager";
import IPCServer, { EngineMethod } from "@src/lib/ipc_server";

export default class Engine {
  config: any;
  orderBookManager: OrderBookManager;
  exchangeMap: Map<ExchangeId, Exchange> = new Map();

  private marketManager = new MarketManager();

  // TODO: need to change ipc to queue
  private ipcServer = new IPCServer()

  constructor(config: any) {
    this.config = config;
    this.orderBookManager = new OrderBookManager(this.config);
  }

  public async initExchanges() {
    for (const exchangeKey in this.config.exchanges) {
      if (!this.config.exchanges[exchangeKey].enabled) continue;
      
      const exchange = (await import(`../../exchanges/${exchangeKey}`)).default;
      const exchangeObject = new exchange(this, this.config, this.config.exchanges[exchangeKey]);
      this.exchangeMap.set(exchangeObject.id, exchangeObject);
    }
  }

  private startIPCServer() {
    this.ipcServer.startPipeline();

    this.ipcServer.addEventListener(EngineMethod.MarketList, (msg: any, socket: any) => {
      const marketList = this.marketManager.getMarketList();
      this.ipcServer.sendMessage(socket, EngineMethod.MarketList, marketList);
    });

    this.ipcServer.addEventListener(EngineMethod.OrderBook, (msg: any, socket: any) => {
      const snapshot = this.orderBookManager.getOrderBookList();
      this.ipcServer.sendMessage(socket, EngineMethod.OrderBook, snapshot);
    });
  }

  public async start() {
    this.startIPCServer();
    await this.initExchanges();

    for (const [exchangeId, exchange] of this.exchangeMap) {
      if (!exchange.isEnabled()) continue;

      exchange.on("updateStatus", status => {
        console.log('state: ', exchangeId, status);
        switch (status) {
          case ExchangeStatus.Idle: {
            break;
          }
          case ExchangeStatus.Initialized: {
            exchange.start();
            break;
          }
          case ExchangeStatus.Running: {
            break;
          }
          case ExchangeStatus.Disconnected: {
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

    this.ipcServer.broadcastEngineMessage("updateOrderBook", data);
  }

  public updateMarketList(exchangeId: ExchangeId, marketList: string[]) {
    this.marketManager.updateMarketList(exchangeId, marketList);
    this.ipcServer.broadcastEngineMessage("marketList", this.marketManager.getMarketList());
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

