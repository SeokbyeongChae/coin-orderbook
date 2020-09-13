import WebSocket from "ws";
import { IPC } from "node-ipc";

/*
ipc.config.id = "hello";
ipc.config.retry = 1500;
// ipc.config.silent = true;

ipc.connectTo("world", function() {
  ipc.of.world.on("message", function(data) {
    console.log(data);
  });
});
*/

const zmq = require("zeromq");
const msgpack = require("msgpack");

const enum subscribeMethod {
  orderBook = "orderBook"
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

      ws.on("message", () => {
        console.log("message");
      });
    });
  }

  async connectEngine(): Promise<boolean> {
    this.ipc.connectTo("engine", () => {
      this.ipc.of.engine.on("connect", (msg: any) => {
        console.log("connect engine..");
      });

      this.ipc.of.engine.on("updateOrderBook", (msg: any) => {
        console.dir(msg);
      });
    });
    return true;
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
