import { Big } from "big.js";
import Sleep from "sleep-promise";
import Exchange, { ExchangeStatus } from "@src/lib/exchange";
import WSConnector from "@src/lib/websocket_connector";
import Api from "@src/lib/api";
import Quant from "@src/quant";
import { OrderBookDatasetItem, OrderType } from "@src/lib/order_book";

export default class Binance extends Exchange {
  wsConnector: BinanceWSConnector;
  exchangeInfoMap: Map<string, BinanceExchangeInformation> = new Map();

  tempOrderBookStreamBuffer: Map<string, Map<number, any>> = new Map();
  tempOrderBookInitialized: Map<string, boolean> = new Map();

  constructor(quant: Quant, config: any, exchangeConfig: any) {
    super(quant, config, exchangeConfig);

    this.wsConnector = new BinanceWSConnector(this.exchangeConfig.webSocketUrl);
  }

  init(): void {
    this.updateMarketInfoTimer();

    this.wsConnector.on("open", async () => {
      this.emit("updateStatus", ExchangeStatus.Running);

      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        console.error("binance error..");
        return;
      }

      for (let i = 0; i < exchangeInfoList.length; i++) {
        const exchangeInfo = exchangeInfoList[i];
        this.exchangeInfoMap.set(exchangeInfo.symbol, exchangeInfo);

        this.tempOrderBookInitialized.set(exchangeInfo.symbol, false);
        this.tempOrderBookStreamBuffer.set(exchangeInfo.symbol, new Map());

        this.wsConnector.sendMessage(
          JSON.stringify({
            method: "SUBSCRIBE",
            params: [`${exchangeInfo.symbol.toLowerCase()}@depth`],
            id: i
          })
        );

        const option = {
          method: "GET",
          url: `${this.endPoint}/api/v3/depth?symbol=${exchangeInfo.symbol}&limit=50`
        };

        const [err, result] = await Api.request(option);
        if (err) {
          console.error(JSON.stringify(err));
          continue;
        }

        this.updateOrderBook(exchangeInfo.baseAsset, exchangeInfo.quoteAsset, OrderType.Ask, result.data.asks);
        this.updateOrderBook(exchangeInfo.baseAsset, exchangeInfo.quoteAsset, OrderType.Bid, result.data.bids);

        const tempOrderBookBuffer = this.tempOrderBookStreamBuffer.get(exchangeInfo.symbol);
        if (!tempOrderBookBuffer) {
          this.tempOrderBookInitialized.set(exchangeInfo.symbol, true);
          await Sleep(200);
          continue;
        }

        for (const [u, orderBookBuffer] of tempOrderBookBuffer) {
          if (orderBookBuffer.U <= result.data.lastUpdateId + 1 && u >= result.data.lastUpdateId) {
          }
        }

        this.tempOrderBookInitialized.set(exchangeInfo.symbol, true);
        await Sleep(200);
      }
    });

    this.wsConnector.on("message", message => {
      this.messageHandler(JSON.parse(message.data));
    });

    this.wsConnector.on("close", async () => {
      console.error("close binance..");
      this.emit("updateStatus", ExchangeStatus.Disconnected);
    });

    this.wsConnector.on("error", async err => {
      console.error(`error binance : ${JSON.stringify(err)}`);
      this.emit("updateStatus", ExchangeStatus.Disconnected);
    });

    this.emit("updateStatus", ExchangeStatus.Initialized);
  }

  start(): void {
    console.log("start binance..");
    this.wsConnector.start();
  }

  stop(): void {
    this.tempOrderBookStreamBuffer.clear();
    this.tempOrderBookInitialized.clear();
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

  private async updateMarketInfoTimer() {
    const execution = async () => {
      const exchangeInfoList = await this.getExchangeInformation();
      if (!exchangeInfoList) {
        console.error("binance get exchange information error..");
        return;
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

  async getExchangeInformation(): Promise<BinanceExchangeInformation[] | undefined> {
    const option = {
      method: "GET",
      url: `${this.endPoint}/api/v3/exchangeInfo`
    };

    const [err, result] = await Api.request(option);
    if (err) {
      console.error(JSON.stringify(err));
      return undefined;
    }

    const dataList: BinanceExchangeInformation[] = [];
    for (const symbol of result.data.symbols) {
      if (!this.quant.isAvailableMarket(symbol.baseAsset, symbol.quoteAsset)) continue;
      if (symbol.status !== "TRADING" || symbol.permissions.findIndex((x: string) => x === "SPOT") === -1) continue;

      dataList.push({
        symbol: symbol.symbol,
        status: symbol.status,
        baseAsset: symbol.baseAsset,
        baseAssetPrecision: symbol.baseAssetPrecision,
        quoteAsset: symbol.quoteAsset,
        quoteAssetPrecision: symbol.quoteAssetPrecision,
        filters: symbol.filters
      });
    }

    return dataList;
  }

  private messageHandler(message: any) {
    switch (message.e) {
      case "depthUpdate": {
        if (!this.tempOrderBookInitialized.get(message.s)) {
          let tempOrderBook = this.tempOrderBookStreamBuffer.get(message.s);
          tempOrderBook!.set(message.u, message);
          return;
        }

        const exchangeInfo = this.exchangeInfoMap.get(message.s);
        if (!exchangeInfo) return console.error(`Cannot find binance market info..`);

        this.updateOrderBook(exchangeInfo.baseAsset, exchangeInfo.quoteAsset, OrderType.Bid, message.b);
        this.updateOrderBook(exchangeInfo.baseAsset, exchangeInfo.quoteAsset, OrderType.Ask, message.a);
        break;
      }
    }
  }
}

class BinanceWSConnector extends WSConnector {
  constructor(url: string) {
    super(url);
  }
}

interface BinanceExchangeInformation {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quoteAssetPrecision: number;
  filters: any[];
}
