import OrderBook, { OrderBookDataset } from "./lib/orderBook";
import Binance from "./exchanges/binance";
import Exchange, { ExchangeStatuses } from "./lib/exchange";
import config from "../config/config.json";
import { OrderType, ExchangeId } from "./common/constants";
import { IPC } from "node-ipc";

// const zmq = require("zeromq/v5-compat");
const zmq = require("zeromq");
const msgpack = require("msgpack");

export default class Quant {
  config: any;

  orderBook: OrderBook;
  exchangeMap: Map<ExchangeId, Exchange> = new Map();

  // zmqSock: any = zmq.socket("pub");
  // zmqSock: any = new zmq.Publisher();
  private ipc = new IPC();
  private processSet: Set<any> = new Set();

  constructor(config: any) {
    this.config = config;

    this.orderBook = new OrderBook(this.config);

    const binanceExchange = new Binance(this, this.config, this.config.exchanges.binance);
    this.exchangeMap.set(ExchangeId.binance, binanceExchange);

    this.ipc.config.id = "engine";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;

    // this.zmqSock.bind("utp://127.0.0.1:3456");
    // this.zmqSock.bind("tcp://*:3456", (err: any) => {
    //   if (err) {
    //     console.log("zeromq error..", JSON.stringify(err));
    //     process.exit(1);
    //   }

    //   console.log("create zeromq socket..");
    // });
  }

  public startPipeline() {
    this.ipc.serve(() => {
      this.ipc.server.on("connect", (socket: any) => {
        // this.ipc.server.emit(socket, "message", "haa");
        this.processSet.add(socket);
        console.log(this.processSet.size);
      });

      this.ipc.server.on("socket.disconnected", (socket: any) => {
        // console.log(data1);
        this.processSet.delete(socket);
        console.log(this.processSet.size);
      });
    });

    this.ipc.server.start();
  }

  private broadcastEngineMessage(method: string, data: any) {
    for (const socket of this.processSet) {
      this.ipc.server.emit(socket, method, data);
    }
  }

  public start() {
    for (const [exchangeId, exchange] of this.exchangeMap) {
      exchange.init();
      exchange.on("updateStatus", status => {
        switch (status) {
          case ExchangeStatuses.idle: {
            break;
          }
          case ExchangeStatuses.initialized: {
            exchange.start();
            break;
          }
          case ExchangeStatuses.running: {
            break;
          }
          case ExchangeStatuses.disconnected: {
            exchange.stop();
            break;
          }
        }
      });

      exchange.on("updateOrderBookByDataset", () => {});
    }
  }

  updateOrderBookByDataset(orderBookDataset: OrderBookDataset) {
    /*
    const data = {
      message: "hello"
    };
    const data1 = msgpack.pack(data);
    this.zmqSock.send([msgpack.pack("orderBook"), data1]);
    */
    const result = this.orderBook.updateOrderBookByDataset(orderBookDataset);
    if (!result) return;

    this.broadcastEngineMessage("updateOrderBook", result);
    // this.zmqSock.send([msgpack.pack("orderBook"), msgpack.pack(result)]);
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

const quant = new Quant(config);
quant.startPipeline();
quant.start();

// const streamServer = new StreamServer(quant);
