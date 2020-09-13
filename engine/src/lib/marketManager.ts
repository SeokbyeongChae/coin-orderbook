import { ExchangeId } from '../common/constants';

export default class MarketManager {
	private marketListByMarket: Map<string, Set<ExchangeId>> = new Map();
	private marketListByExchangeId: Map<ExchangeId, Set<string>> = new Map();

	constructor() {

	}

	addMarketList(exchangeId: ExchangeId, baseAsset: string, quoteAsset: string) {
		const market = `${baseAsset}/${quoteAsset}`;
		let marketExchangeIdSet = this.marketListByMarket.get(market);
		if (!marketExchangeIdSet) {
			marketExchangeIdSet = new Set();
			this.marketListByMarket.set(market, marketExchangeIdSet);
		}

		marketExchangeIdSet.add(exchangeId);
	}

	removeAllMarketByExchangeId(exchangeId: ExchangeId) {
		for(const [market, exchangeIdSet] of this.marketListByMarket) {
			exchangeIdSet.delete(exchangeId);
		}

		this.marketListByExchangeId.delete(exchangeId);
	}

	getMarketList(): Map<string, Set<ExchangeId>>{
		return this.marketListByMarket;	
	}

	getMarketListByExchangeId(exchangeId: ExchangeId): Set<string> | undefined {
		return this.marketListByExchangeId.get(exchangeId)
	}
}