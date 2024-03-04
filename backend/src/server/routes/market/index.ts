import Client from "@src/client";
import Server from "@src/server";
import Router from "@src/server/routes";
import { MessageData, MessageType, ResultType, SubscribeMethod } from "@src/server/type";

export default class MarketRouter extends Router {
  constructor(server: Server) {
    super(server);
  }

  public process(message: MessageData, client: Client): void {
    switch (message.type) {
      case MessageType.Subscribe: {
        switch (message.method) {
          case null:
          case undefined: {
            this.server.subscribeData(SubscribeMethod.Market, client, message.reqId);

            const response = {
              market: this.server.marketManager.getMarketList(),
            };
            
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