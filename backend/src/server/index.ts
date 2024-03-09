import WebSocket from "ws";
import OrderBookManager from "@src/lib/order_book_manager";
import config from "../../config/config.json";
import Client, { ClientId } from "@src/client";
import MarketManager from "@src/lib/market_manager";

import EventConnector, { EngineMethod } from "@src/server/event_connector"
import EngineMessageHandler from "@src/server/engine_message_handler";

import { ResultType, RouteComponent, SubscribeMethod, Subscriber } from "./type"
import Router from "@src/server/routes";
import OrderBookRouter from "@src/server/routes/order_book";
import MarketRouter from "@src/server/routes/market";

export default class Server {
  // private engineSock = new zmq.Subscriber();
  public routerMap: Map<RouteComponent, Router> = new Map();

  public orderBookManager = new OrderBookManager(config);
  public marketManager = new MarketManager();
  public engineDomanin = "engine";
  public engineConnector = new EventConnector("amqp://localhost", "orderbook", "server")

  private wss: WebSocket.Server | undefined;

  private clientListMap: Map<ClientId, Client> = new Map();
  private subscriberMap: Map<SubscribeMethod, Map<ClientId, Subscriber>> = new Map();

  constructor() {
    this.initRouteMap();
    this.initSubscriberMap();
    this.initMarketManagerEventHandler();
    this.initOrderBookManagerEventHandler();
    // this.logger.lo
  }

  async run(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.wss.on("connection", (ws: WebSocket, req: Request) => {
      console.log("connect client..");
      const client = new Client(this, ws);
      this.clientListMap.set(client.getId(), client);

      ws.onclose = () => {
        console.log("disconnect client..");
        this.removeClient(client.getId());
      }

      ws.onerror = () => {
        ws.close();
      }
    });
  }

  async connectEngine() {
    await this.engineConnector.run(EngineMessageHandler.getInstance(this).process);
    this.engineConnector.broadcastMessage(this.engineDomanin, EngineMethod.MarketList);
    this.engineConnector.broadcastMessage(this.engineDomanin, EngineMethod.OrderBook);
  }

  private initMarketManagerEventHandler() {
    this.marketManager.on("updateMarketList", (marketList: any[]) => {
      this.distributeSubscriptionData(SubscribeMethod.Market, marketList);
    });
  }

  private initOrderBookManagerEventHandler() {
    this.orderBookManager.on("updateOrderBook", (orderBook: any) => {
      this.distributeSubscriptionData(SubscribeMethod.OrderBook, orderBook);
    });
  }

  private initRouteMap() {
    this.routerMap.set(RouteComponent.Market, new MarketRouter(this));
    this.routerMap.set(RouteComponent.OrderBook, new OrderBookRouter(this));
  }

  private initSubscriberMap() {
    this.subscriberMap.set(SubscribeMethod.OrderBook, new Map());
    this.subscriberMap.set(SubscribeMethod.Market, new Map());
  }

  private removeClient(clientId: string) {
    this.clientListMap.delete(clientId);

    this.subscriberMap.forEach((subscriberMap) => {
      if (subscriberMap.has(clientId)) {
        subscriberMap.delete(clientId);
      }
    })
  }

  public subscribeData(method: SubscribeMethod, client: Client, requestId: string, compare?: Function) {
    const subscribeMap = this.subscriberMap.get(method);
    if (!subscribeMap) {
      return console.error(`failed to subscribe: ${method}`);
    }

    subscribeMap.set(client.getId(), {
      reqId: requestId,
      compare
    });
  }

  public unsubscribeData(method: SubscribeMethod, client: Client) {
    const subscribeMap = this.subscriberMap.get(method);
    if (!subscribeMap) {
      return console.error(`failed to unsubscribe: ${method}`);
    }

    subscribeMap.delete(client.getId());
  }

  private distributeSubscriptionData(method: SubscribeMethod, data: any) {
    const subscribeMap = this.subscriberMap.get(method);
    if (!subscribeMap) {
      return console.error(`cannot define subscribe type: ${method}`);
    }

    subscribeMap.forEach((subscriber, clientId) => {
      const client = this.clientListMap.get(clientId);
      if (!client) return;

      if (!subscriber.compare) {
        client.sendMessage(subscriber.reqId, ResultType.OK, data);
      } else if (subscriber.compare(data)) {
        client.sendMessage(subscriber.reqId, ResultType.OK, data);
      }
    });
  }
}
