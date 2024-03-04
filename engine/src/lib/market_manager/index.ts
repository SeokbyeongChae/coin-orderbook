import { ExchangeId } from "../../common/constants";

export default class MarketManager {
  private exchangeListByMarket: Map<string, Set<ExchangeId>> = new Map();
  private marketListByExchangeId: Map<ExchangeId, Set<string>> = new Map();

  constructor() {}

  addMarketList(exchangeId: ExchangeId, baseAsset: string, quoteAsset: string) {
    const market = `${baseAsset}/${quoteAsset}`;
    let marketExchangeIdSet = this.exchangeListByMarket.get(market);
    if (!marketExchangeIdSet) {
      marketExchangeIdSet = new Set();
      this.exchangeListByMarket.set(market, marketExchangeIdSet);
    }

    marketExchangeIdSet.add(exchangeId);
  }

  updateMarketList(exchangeId: ExchangeId, marketList: string[]) {
    let exchangeMarketSet = this.marketListByExchangeId.get(exchangeId);
    if (!exchangeMarketSet) {
      exchangeMarketSet = new Set();
      this.marketListByExchangeId.set(exchangeId, exchangeMarketSet);
    }

    for (let market of exchangeMarketSet) {
      if (marketList.findIndex((x: string) => x === market) === -1) {
        exchangeMarketSet.delete(market);

        const exchangeSet = this.exchangeListByMarket.get(market);
        if (!exchangeSet) continue;

        exchangeSet.delete(exchangeId);
        if (exchangeSet.size === 0) {
          this.exchangeListByMarket.delete(market);
        }
      }
    }

    for (let market of marketList) {
      if (!exchangeMarketSet.has(market)) {
        exchangeMarketSet.add(market);

        let exchangeSet = this.exchangeListByMarket.get(market);
        if (!exchangeSet) {
          exchangeSet = new Set();
          this.exchangeListByMarket.set(market, exchangeSet);
        }

        exchangeSet.add(exchangeId);
      }
    }
  }

  getMarketList(): any[] {
    const result = [];

    for (const [market, exchangeIdSet] of this.exchangeListByMarket) {
      result.push([market, [...exchangeIdSet]]);
    }

    return result;
  }
}
