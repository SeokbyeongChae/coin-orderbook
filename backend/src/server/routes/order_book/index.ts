import Client from "@src/client";
import Server from "@src/server";
import Router from "@src/server/routes";
import { MessageData, MessageType, ResultType, SubscribeMethod } from "@src/server/type";

export default class OrderBookRouter extends Router {
  constructor(server: Server) {
    super(server);
  }

  public process(message: MessageData, client: Client): void {
    switch (message.type) {
      case MessageType.Subscribe: {
        switch (message.method) {
          case null:
          case undefined: {
            const market = message.params.market;
            const markets = market.split("/");
            const response = {
              market,
              marketOrderBook: this.server.orderBookManager.getOrderBooK(markets[0], markets[1])
            };
            
            this.server.subscribeData(SubscribeMethod.OrderBook, client, message.reqId, (param: any) => {
              return param.market === market;
            });
            
            client.sendMessage(message.reqId, ResultType.OK, response);
            break;
          }
        }
        break;
      }
      case MessageType.Unsubscribe: {
        break;
      }
      case MessageType.Call: {
        break;
      }
      case MessageType.CallList: {
        break;
      }
    }
  }
}