import { TypedEmitter } from "tiny-typed-emitter";
import { ExchangeId } from "../common/constants";

interface MarketManagerEvents {
  updateMarketList: (marketList: any[]) => void;
  updateMarket: (market: any[]) => void;
  test: () => void;
}

export default class MarketManager extends TypedEmitter<MarketManagerEvents> {
  private marketList: Map<string, Set<ExchangeId>> = new Map();

  constructor() {
    super();
  }

  public updateMarketList(marketList: any[]) {
    this.emit("test");

    for (const marketInfo of marketList) {
      this.marketList.set(marketInfo[0], new Set(marketInfo[1]));
    }

    this.emit("updateMarketList", this.getMarketList());
  }

  public getMarketList(): any[] {
    const result = [];
    for (const [market, exchangeIdSet] of this.marketList) {
      result.push([market, [...exchangeIdSet]]);
    }
    return result;
  }
}
