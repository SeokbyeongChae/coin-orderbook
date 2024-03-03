// import { CoinbasePro } from "coinbase-pro-node";
import { Big } from "big.js";
import Exchange, { ExchangeStatus } from "@src/lib/exchange";
import WSConnector from "@src/lib/websocket_connector";
import { OrderBookDatasetItem, OrderType } from "@src/lib/order_book";
import Api from "@src/lib/api";

import Engine from "@src/lib/engine";

export default class Coinbase extends Exchange {
  wsConnector: CoinbaseWSConnector;

  constructor(engine: Engine, config: any, exchangeConfig: any) {
    super(engine, config, exchangeConfig);

    this.wsConnector = new CoinbaseWSConnector(this.exchangeConfig.webSocketUrl);
  }

  init(): void {
    this.updateMarketInfoTimer();

    this.wsConnector.on("open", async () => {
      this.emit("updateStatus", ExchangeStatus.Running);

      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        return console.error("coinbase error..");
      }

      const productIds = exchangeInfoList.map(exchangeInfo => {
        return `${exchangeInfo.baseAsset}-${exchangeInfo.quoteAsset}`;
      });

      this.wsConnector.sendMessage(
        JSON.stringify({
          type: "subscribe",
          product_ids: productIds,
          channels: [{ name: "level2" }]
        })
      );
    });

    this.wsConnector.on("message", message => {
      this.messageHandler(JSON.parse(message.data));
    });

    this.wsConnector.on("close", async () => {
      console.error("close coinbase..");
      this.emit("updateStatus", ExchangeStatus.Disconnected);
    });

    this.wsConnector.on("error", async err => {
      console.error(`error coinbase : ${JSON.stringify(err)}`);
      this.emit("updateStatus", ExchangeStatus.Disconnected);
    });

    this.emit("updateStatus", ExchangeStatus.Initialized);
  }

  start(): void {
    console.log("start coinbase..");
    this.wsConnector.start();
  }

  stop(): void {
    // this.tempOrderBookStreamBuffer.clear();
    // this.tempOrderBookInitialized.clear();
  }

  private async updateMarketInfoTimer() {
    const execution = async () => {
      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        return console.error("coinbase get product information error..");
      }

      const marketList: string[] = [];
      for (let i = 0; i < exchangeInfoList.length; i++) {
        const exchangeInfo = exchangeInfoList[i];
        marketList.push(`${exchangeInfo.baseAsset}/${exchangeInfo.quoteAsset}`);
      }

      this.engine.updateMarketList(this.id, marketList);
    };

    await execution();
    setInterval(async () => {
      await execution();
    }, 1000 * 60 * 60 * 24);
  }

  async getExchangeInformation(): Promise<CoinbaseExchangeInformation[] | undefined> {
    const option = {
      method: "GET",
      url: `${this.endPoint}/products`
    };

    const [err, result] = await Api.request(option);
    if (err) {
      console.dir(JSON.stringify(err));
      return undefined;
    }

    const dataList: CoinbaseExchangeInformation[] = [];
    for (const data of result.data) {
      if (data.status !== "online") continue;

      dataList.push({ baseAsset: data.base_currency, quoteAsset: data.quote_currency });
    }

    return dataList;
  }

  private updateOrderBook(baseAsset: string, quoteAsset: string, orderType: OrderType, data: any[]) {
    const orderbookData: OrderBookDatasetItem[] = [];
    for (const item of data) {
      orderbookData.push({
        bgPrice: new Big(item[0]),
        bgAmount: Number(item[1]) === 0 ? undefined : new Big(item[1])
      });
    }

    this.updateOrderBookByDataset(baseAsset, quoteAsset, orderType, orderbookData);
  }

  messageHandler(message: any) {
    console.dir(message);
    switch (message.type) {
      case "snapshot": {
        const market = message.product_id.split("-");
        this.updateOrderBook(market[0], market[1], OrderType.Bid, message.bids);
        this.updateOrderBook(market[0], market[1], OrderType.Ask, message.asks);
        break;
      }
      case "l2update": {
        const market = message.product_id.split("-");
        const bids: any[] = [];
        const asks: any[] = [];

        for (const data of message.changes) {
          if (data[0] === "buy") {
            bids.push([data[1], data[2]]);
          } else {
            asks.push([data[1], data[2]]);
          }
        }

        if (bids.length !== 0) this.updateOrderBook(market[0], market[1], OrderType.Bid, bids);
        if (asks.length !== 0) this.updateOrderBook(market[0], market[1], OrderType.Ask, asks);
        break;
      }
    }
  }
}

class CoinbaseWSConnector extends WSConnector {
  constructor(url: string) {
    super(url);
  }
}

interface CoinbaseExchangeInformation {
  baseAsset: string;
  quoteAsset: string;
}
