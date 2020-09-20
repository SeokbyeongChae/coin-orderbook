import { ExchangeId } from "../common/constants";

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

  removeAllMarketByExchangeId(exchangeId: ExchangeId) {
    for (const [market, exchangeIdSet] of this.exchangeListByMarket) {
      exchangeIdSet.delete(exchangeId);
    }

    this.marketListByExchangeId.delete(exchangeId);
  }

  getMarketList(): any[] {
    const result = [];

    for (const [market, exchangeIdSet] of this.exchangeListByMarket) {
      result.push([market, [...exchangeIdSet]]);
    }

    return result;
  }

  getMarketListByExchangeId(exchangeId: ExchangeId): Set<string> | undefined {
    return this.marketListByExchangeId.get(exchangeId);
  }
}
