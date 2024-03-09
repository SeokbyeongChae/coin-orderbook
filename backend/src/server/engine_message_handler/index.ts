import Server from "@src/server";
import { EngineMethod, EventMessage } from "@src/server/event_connector";
import { OrderType } from "@src/lib/order_book_manager";
import Amqp from "amqplib/callback_api"

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

  public process(msg: Amqp.Message) {
    if (!msg || !msg.content) return;

    const engineData: EventMessage = JSON.parse(msg.content.toString());
    switch (engineData.method) {
      case EngineMethod.MarketList: {
        EngineMessageHandler.updateMarketList(engineData.data)
        break;
      }
      case EngineMethod.OrderBook: {
        EngineMessageHandler.initOrderBook(engineData.data)
        break;
      }
      case EngineMethod.UpdateOrderBook: {
        EngineMessageHandler.updateOrderBook(engineData.data)
        break;
      }
      default: {
        throw Error(`unknown engine methid: ${engineData.method}`)
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