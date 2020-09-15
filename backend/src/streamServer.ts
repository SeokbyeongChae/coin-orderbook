import WebSocket from "ws";
import { IPC } from "node-ipc";

const enum engineMethod {
  orderBook = "orderBook",
  updateOrderBook = "updateOrderBook",
  marketList = "marketList"
}

const enum method {
  market_list = "market/list"
}

export default class StreamServer {
  // private engineSock = new zmq.Subscriber();
  private ipc = new IPC();
  private wss: WebSocket.Server | undefined;

  private clientListSet: Set<WebSocket> = new Set();

  messageCnt: number = 0;
  constructor() {
    this.ipc.config.id = "client";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;
  }

  async start() {
    this.wss = new WebSocket.Server({
      port: 4000
    });

    this.wss.on("connection", (ws: WebSocket, req: Request) => {
      this.clientListSet.add(ws);
      console.log("connection");

      ws.on("close", () => {
        this.clientListSet.delete(ws);
        console.log("close");
      });

      ws.on("message", msg => {
        this.messageHandler(msg);
      });
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

      this.ipc.of.engine.on(engineMethod.updateOrderBook, (msg: any) => {
        this.engineMessageHandler(engineMethod.updateOrderBook, msg);
      });

      this.ipc.of.engine.on(engineMethod.marketList, (msg: any) => {
        this.engineMessageHandler(engineMethod.marketList, msg);
      });
    });
    return true;
  }

  async requestEngineData(method: string, param?: any) {
    if (!this.ipc.of.engine) {
      return console.log("fail to request engine data..");
    }

    this.ipc.of.engine.emit(method, param);
  }

  async engineMessageHandler(method: string, msg: any) {
    switch (method) {
      case engineMethod.marketList: {
        console.dir(msg);
        break;
      }
      case engineMethod.orderBook: {
        console.log("test1..");
        console.dir(msg);
        for (const orderBookInfo of msg.ask) {
          console.dir(orderBookInfo[0]);
          console.dir(orderBookInfo[1]);
        }
        break;
      }
      case engineMethod.updateOrderBook: {
        console.dir(msg.data);
        break;
      }
      default: {
        console.log(`unknown engine methid: ${method}`);
      }
    }
  }

  async messageHandler(msg: any) {
    let message;
    try {
      message = JSON.parse(msg);
    } catch (err) {
      return console.log(`fail to parse client message: ${JSON.parse(err)}`);
    }

    switch (message.method) {
      case method.market_list: {
        this.requestEngineData(engineMethod.marketList);
        break;
      }
      default: {
        console.log(`unknown client methid: ${msg}`);
      }
    }
  }

  /*
  async connectEngine(): Promise<boolean> {
    console.log("connect engine..");
    this.engineSock.connect("tcp://127.0.0.1:3456");

    this.subscribe(subscribeMethod.orderBook);

    for await (const [topic, msg] of this.engineSock) {
      this.messageHandler(topic, msg);
    }

    return true;
  }

  async subscribe(topic: string) {
    this.engineSock.subscribe(msgpack.pack(topic));
  }

  messageHandler(rawTopic: any, rawMsg: any) {
    const topic = msgpack.unpack(rawTopic);
    const msg = msgpack.unpack(rawMsg);

    switch (topic) {
      case subscribeMethod.orderBook: {
        // console.dir(msg);
        if (++this.messageCnt % 100 === 0) console.log(this.messageCnt);
        break;
      }
      default: {
        console.log(`unknown subscribe method: ${topic}`);
      }
    }
  }
  */
}
