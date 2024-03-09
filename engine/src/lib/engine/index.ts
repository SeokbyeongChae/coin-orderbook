import OrderBookManager, { OrderBookDataset } from "@src/lib/order_book";
import Exchange, { ExchangeStatus, ExchangeId } from "@src/lib/exchange";
import MarketManager from "@src/lib/market_manager";
import EventConnector, { EngineMethod, EventMessage } from "@src/lib/event_connector";

export default class Engine {
  config: any;
  orderBookManager: OrderBookManager;
  exchangeMap: Map<ExchangeId, Exchange> = new Map();

  private marketManager = new MarketManager();
  private serverDomain = "server";
  private eventConnector = new EventConnector("amqp://localhost", "orderbook", "engine")

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

  private async startEventConnector() {
    await this.eventConnector.run((msg) => {
      if (!msg || !msg.content) return;

      const serverMessage: EventMessage = JSON.parse(msg.content.toString())
      switch(serverMessage.method) {
        case EngineMethod.MarketList: {
          this.eventConnector.broadcastMessage(this.serverDomain, EngineMethod.MarketList, this.marketManager.getMarketList());
          break;
        }
        case EngineMethod.OrderBook: {
          this.eventConnector.broadcastMessage(this.serverDomain, EngineMethod.OrderBook, this.orderBookManager.getOrderBookList());
          break;
        }
      }
    })
  }

  public async start() {
    await this.startEventConnector();
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

    this.eventConnector.broadcastMessage(this.serverDomain, EngineMethod.UpdateOrderBook, data);
  }

  public updateMarketList(exchangeId: ExchangeId, marketList: string[]) {
    this.marketManager.updateMarketList(exchangeId, marketList);
    this.eventConnector.broadcastMessage(this.serverDomain, EngineMethod.MarketList, this.marketManager.getMarketList());
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

