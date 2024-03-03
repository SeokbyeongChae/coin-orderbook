import WebSocket from "ws";
import { IPC } from "node-ipc";
import OrderBookManager from "./lib/orderBook";
import config from "../config/config.json";
import { OrderType, MethodType, Method } from "./common/constants";
import StreamClient from "./streamClient";
import MarketManager from "./lib/marketManager";

const enum engineMethod {
  orderBook = "orderBook",
  updateOrderBook = "updateOrderBook",
  marketList = "marketList"
}

// const enum methodType

export default class Server {
  // private engineSock = new zmq.Subscriber();
  public orderBookManager: OrderBookManager = new OrderBookManager(config);
  public marketManager: MarketManager = new MarketManager();

  private ipc = new IPC();
  private wss: WebSocket.Server | undefined;

  private clientListMap: Map<WebSocket, StreamClient> = new Map();

  // <socket, param>
  private subscriberMap: Map<Method, Map<any, any>> = new Map();

  constructor() {
    this.ipc.config.id = "client";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;

    this.initSubscriberMap();
    this.initMarketManagerEventHandler();
    this.initOrderBookManagerEventHandler();
  }

  async run(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.wss.on("connection", (ws: WebSocket, req: Request) => {
      console.log("connect client..");
      this.clientListMap.set(ws, new StreamClient(this, ws));
    });
  }

  async connectEngine(): Promise<boolean> {
    this.ipc.connectTo("engine", () => {
      this.ipc.of.engine.on("connect", (msg: any) => {
        console.log("connect engine..");
        this.requestEngineData(engineMethod.marketList);
        this.requestEngineData(engineMethod.orderBook);
      });

      this.ipc.of.engine.on(engineMethod.orderBook, (msg: any) => {
        this.engineMessageHandler(engineMethod.orderBook, msg);
      });

      
      this.ipc.of.engine.on(engineMethod.marketList, (msg: any) => {
        this.engineMessageHandler(engineMethod.marketList, msg);
      });

      this.ipc.of.engine.on(engineMethod.updateOrderBook, (msg: any) => {
        this.engineMessageHandler(engineMethod.updateOrderBook, msg);
      });
    });
    return true;
  }

  async requestEngineData(method: string, param?: any) {
    if (!this.ipc.of.engine) {
      return console.error("fail to request engine data..");
    }

    this.ipc.of.engine.emit(method, param);
  }

  async engineMessageHandler(method: string, msg: any) {
    switch (method) {
      case engineMethod.marketList: {
        this.marketManager.updateMarketList(msg);
        break;
      }
      case engineMethod.orderBook: {
        for (const orderBook of msg) {
          const markets = orderBook.market.split("/");
          this.orderBookManager.udateOrderBook(markets[0], markets[1], OrderType.ask, orderBook.ask);
          this.orderBookManager.udateOrderBook(markets[0], markets[1], OrderType.bid, orderBook.bid);
        }
        break;
      }
      case engineMethod.updateOrderBook: {
        this.orderBookManager.udateOrderBook(msg.baseAsset, msg.quoteAsset, msg.orderType, msg.data);
        break;
      }
      default: {
        console.log(`unknown engine methid: ${method}`);
      }
    }
  }

  private initSubscriberMap() {
    this.subscriberMap.set(Method.subscribeMarket, new Map());
    this.subscriberMap.set(Method.subscribeOrderBook, new Map());
  }

  public unsub(client: StreamClient) {
    // TODO: loop, privateDataSub 
    // TODO: remove clientIp
  }

  public privateDataSub(subscribeType: Method, client: StreamClient, compare: any) {
    const subscribeMap = this.subscriberMap.get(subscribeType);
    if (!subscribeMap) {
      return console.log(`fail to subscribe: ${subscribeType}`);
    }

    subscribeMap.set(client, compare);
  }

  public privateDataUnsub(subscribeType: Method, client: StreamClient) {
    const subscribeMap = this.subscriberMap.get(subscribeType);
    if (!subscribeMap) {
      return console.log(`fail to unsubscribe: ${subscribeType}`);
    }

    subscribeMap.delete(client);
  }

  private distributeSubscriptionData(subscribeType: Method, data: any) {
    const subscribeMap = this.subscriberMap.get(subscribeType);
    if (!subscribeMap) {
      return console.error(`cannot define subscribe type: ${subscribeType}`);
    }

    subscribeMap.forEach((compare, client) => {
      if (!compare) {
        client.sendMessage(MethodType.subscribe, subscribeType, data);
      } else {
        if (compare(data)) {
          client.sendMessage(MethodType.subscribe, subscribeType, data);
        }
      }
    });
  }

  private initMarketManagerEventHandler() {
    this.marketManager.on("updateMarketList", (marketList: any[]) => {
      this.distributeSubscriptionData(Method.subscribeMarket, marketList);
    });
  }

  private initOrderBookManagerEventHandler() {
    this.orderBookManager.on("updateOrderBook", (orderBook: any) => {
      this.distributeSubscriptionData(Method.subscribeOrderBook, orderBook);
    });
  }
}
