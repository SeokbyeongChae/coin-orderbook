import OrderBook, { OrderBookDataset } from './lib/orderBook';
import Binance from './exchanges/binance';
import Exchange, { ExchangeStatuses } from './lib/exchange';
import config from '../config/config.json';
import { OrderType, ExchangeId } from './common/constants';
import { IPC } from 'node-ipc';
import marketManager from './lib/marketManager'
import MarketManager from './lib/marketManager';

export default class Quant {
  config: any;

  orderBook: OrderBook;


  exchangeMap: Map<ExchangeId, Exchange> = new Map();
  

  private ipc = new IPC();
  private processSet: Set<any> = new Set();
  private marketManager: MarketManager = new marketManager();

  constructor(config: any) {
    this.config = config;

    this.orderBook = new OrderBook(this.config);

    const binanceExchange = new Binance(this, this.config, this.config.exchanges.binance);
    this.exchangeMap.set(ExchangeId.binance, binanceExchange);

    this.ipc.config.id = 'engine';
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;
  }

  public startPipeline() {
    this.ipc.serve(() => {
      this.ipc.server.on('connect', (socket: any) => {
        this.processSet.add(socket);
        console.log(this.processSet.size);
      });

      this.ipc.server.on('socket.disconnected', (socket: any) => {
        this.processSet.delete(socket);
        console.log(this.processSet.size);
      });

      this.ipc.server.on('marketList', (data: any, socket: any) => {
        const marketList = this.marketManager.getMarketList();
        console.log(data);
        this.ipc.server.emit(socket, "marketList", marketList);
      });

      this.ipc.server.on('orderBook', (data: any, socket: any) => {
        const snapshot = {
          ask: this.orderBook.getOrderBookMap(OrderType.ask),
          bid: this.orderBook.getOrderBookMap(OrderType.bid)
        }
        
        this.ipc.server.emit(socket, "orderBook", snapshot);
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
      exchange.on('updateStatus', status => {
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

      exchange.on('updateOrderBookByDataset', () => {});
    }
  }

  public updateOrderBookByDataset(orderBookDataset: OrderBookDataset) {
    const marketOrderMap = this.orderBook.updateOrderBookByDataset(orderBookDataset);
    if (!marketOrderMap) return;

    let orderBookIndex = 0;
    const updatedPriceList = [];
    for (const [bgPrice, orderBookItem] of marketOrderMap.entries()) {
      if (orderBookIndex++ >= this.orderBook.orderBookDepth) break;

      const index = orderBookDataset.dataList.findIndex( x => x.bgPrice.eq(bgPrice));
      if (index !== -1 ){
        updatedPriceList.push([bgPrice, orderBookItem])
      }
    }

    const data = {
      baseAsset: orderBookDataset.baseAsset,
      quoteAsset: orderBookDataset.quoteAsset,
      orderType: orderBookDataset.orderType,
      data: updatedPriceList
    }

    this.broadcastEngineMessage('updateOrderBook', data);
  }

  public addMarketList(exchangeId: ExchangeId, baseAsset: string, quoteAsset: string) {
    this.marketManager.addMarketList(exchangeId, baseAsset, quoteAsset);
    
    this.broadcastEngineMessage('marketList', this.marketManager.getMarketList());
	}

	public removeAllMarketByExchangeId(exchangeId: ExchangeId) {
    this.marketManager.removeAllMarketByExchangeId(exchangeId);
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
