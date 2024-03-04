import Server from "@src/server";
import { EngineMethod, EngineMessage } from "@src/server/engine_connector";
import { OrderType } from "@src/lib/order_book_manager";

export default class EngineMessageHandler {
  private static server: Server;
  private static instance: EngineMessageHandler;

  private constructor(server: Server) {
    EngineMessageHandler.server = server;
  }

  public static getInstance(server: Server) {
    if (!EngineMessageHandler.instance) {
      EngineMessageHandler.instance = new EngineMessageHandler(server);
    }
    
    return EngineMessageHandler.instance;
  }

  public process(msg: EngineMessage) {
    switch (msg.method) {
      case EngineMethod.MarketList: {
        EngineMessageHandler.updateMarketList(msg.data)
        break;
      }
      case EngineMethod.OrderBook: {
        EngineMessageHandler.initOrderBook(msg.data)
        break;
      }
      case EngineMethod.UpdateOrderBook: {
        EngineMessageHandler.updateOrderBook(msg.data)
        break;
      }
      default: {
        throw Error(`unknown engine methid: ${msg.method}`)
      }
    }
  }

  private static updateMarketList(data: any) {
    EngineMessageHandler.server.marketManager.updateMarketList(data);
  }

  private static initOrderBook(data: any) {
    for (const orderBook of data) {
      const markets = orderBook.market.split("/");
      EngineMessageHandler.server.orderBookManager.udateOrderBook(markets[0], markets[1], OrderType.ask, orderBook.ask);
      EngineMessageHandler.server.orderBookManager.udateOrderBook(markets[0], markets[1], OrderType.bid, orderBook.bid);
    }
  }

  private static updateOrderBook(data: any) {
    EngineMessageHandler.server.orderBookManager.udateOrderBook(data.baseAsset, data.quoteAsset, data.orderType, data.data);
  }
}