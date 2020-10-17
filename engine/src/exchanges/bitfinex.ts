// import { CoinbasePro } from "coinbase-pro-node";
import { Big } from "big.js";
import Exchange, { ExchangeStatuses } from "../lib/exchange";
import WSConnector from "../lib/wsConnector";
import { OrderBookDatasetItem } from "../lib/orderBook";
import { OrderType } from "../common/constants";
import Util from "../common/util";

import Quant from "../quant";

export default class Bitfinex extends Exchange {
  wsConnector: BitfinexWSConnector;
  subscribeOrderBookMap: Map<string, string[]> = new Map();
  orderBookIdMap: Map<number, string[]> = new Map();
  orderBookSnapshotMap: Map<number, boolean> = new Map();

  constructor(quant: Quant, config: any, exchangeConfig: any) {
    super(quant, config, exchangeConfig);

    this.wsConnector = new BitfinexWSConnector(this.exchangeConfig.webSocketUrl);
  }

  init(): void {
    this.updateMarketInfoTimer();

    this.wsConnector.on("open", async () => {
      console.log("connect bitfinex..");
      this.emit("updateStatus", ExchangeStatuses.running);

      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        return console.log("bitfinex error..");
      }

      for (const exchangeInfo of exchangeInfoList) {
        const symbol = `t${exchangeInfo.baseAsset}${exchangeInfo.quoteAsset}`;

        this.wsConnector.sendMessage(
          JSON.stringify({
            event: "subscribe",
            channel: "book",
            symbol: symbol,
            freq: "F1"
          })
        );

        this.subscribeOrderBookMap.set(symbol, [exchangeInfo.baseAsset, exchangeInfo.quoteAsset]);
      }
    });

    this.wsConnector.on("message", message => {
      try {
        this.messageHandler(JSON.parse(message.data));
      } catch (err) {
        this.messageHandler(message.data);
      }
    });

    this.wsConnector.on("close", async () => {
      console.log("close bitfinex..");
      this.emit("updateStatus", ExchangeStatuses.disconnected);
    });

    this.wsConnector.on("error", async err => {
      console.log(`error bitfinex : ${JSON.stringify(err)}`);
    });

    this.emit("updateStatus", ExchangeStatuses.initialized);
  }

  start(): void {
    console.log("start bitfinex..");
    this.wsConnector.start();
  }

  stop(): void {
    this.subscribeOrderBookMap.clear();
    this.orderBookIdMap.clear();
    this.orderBookSnapshotMap.clear();
  }

  private async updateMarketInfoTimer() {
    const execution = async () => {
      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        return console.log("bitfinex get product information error..");
      }

      const marketList: string[] = [];
      for (let i = 0; i < exchangeInfoList.length; i++) {
        const exchangeInfo = exchangeInfoList[i];
        marketList.push(`${exchangeInfo.baseAsset}/${exchangeInfo.quoteAsset}`);
      }

      this.quant.updateMarketList(this.id, marketList);
    };

    await execution();
    setInterval(async () => {
      await execution();
    }, 1000 * 60 * 60 * 24);
  }

  async getExchangeInformation(): Promise<BitfinexExchangeInformation[] | undefined> {
    const option = {
      method: "GET",
      url: `${this.endPoint}/conf/pub:list:pair:exchange`
    };

    const [err, result] = await Util.request(option);
    if (err) {
      console.dir(JSON.stringify(err));
      return undefined;
    }

    const dataList: BitfinexExchangeInformation[] = [];
    for (const data of result.data[0]) {
      let tempData;
      if (data.length === 6) {
        tempData = { baseAsset: data.substring(0, 3), quoteAsset: data.substring(3, 7) };
      } else {
        const market = data.split(":");
        tempData = { baseAsset: market[0], quoteAsset: market[1] };
      }

      if (this.quant.isAvailableMarket(tempData.baseAsset, tempData.quoteAsset)) {
        dataList.push(tempData);
      }
    }

    return dataList;
  }

  private updateOrderBook(baseAsset: string, quoteAsset: string, data: any[]) {
    // orderType: OrderType

    const orderbookBidData: OrderBookDatasetItem[] = [];
    const orderbookAskData: OrderBookDatasetItem[] = [];
    for (const item of data) {
      if (item[1] === 0) {
        const data = {
          bgPrice: new Big(item[0]),
          bgAmount: undefined
        };

        if (item[2] === 1) {
          orderbookBidData.push(data);
        } else {
          orderbookAskData.push(data);
        }
      } else {
        const data = {
          bgPrice: new Big(item[0]),
          bgAmount: new Big(item[2])
        };

        if (data.bgAmount.gt(0)) {
          orderbookBidData.push(data);
        } else {
          data.bgAmount = data.bgAmount.abs();
          orderbookAskData.push(data);
        }
      }
    }

    if (orderbookBidData.length !== 0) {
      this.updateOrderBookByDataset(baseAsset, quoteAsset, this.id, OrderType.bid, orderbookBidData);
    }

    if (orderbookAskData.length !== 0) {
      this.updateOrderBookByDataset(baseAsset, quoteAsset, this.id, OrderType.ask, orderbookAskData);
    }
  }

  messageHandler(message: any) {
    // console.dir(message);
    switch (message.event) {
      case "info": {
        break;
      }
      case "subscribed": {
        switch (message.channel) {
          case "book": {
            const market = this.subscribeOrderBookMap.get(message.symbol);
            if (!market) return;

            this.orderBookIdMap.set(message.chanId, market);
            this.orderBookSnapshotMap.set(message.chanId, true);
            break;
          }
        }
        break;
      }
      default: {
        const markets = this.orderBookIdMap.get(message[0]);
        if (!markets) return;

        if (this.orderBookSnapshotMap.has(message[0])) {
          this.updateOrderBook(markets[0], markets[1], message[1]);
          this.orderBookSnapshotMap.delete(message[0]);
        } else {
          this.updateOrderBook(markets[0], markets[1], [message[1]]);
        }
        break;
      }
    }
  }
}

class BitfinexWSConnector extends WSConnector {
  constructor(url: string) {
    super(url);
  }
}

interface BitfinexExchangeInformation {
  baseAsset: string;
  quoteAsset: string;
}
