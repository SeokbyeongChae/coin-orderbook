export default abstract class constants {}

export const enum OrderType {
  ask = 1,
  bid = 2
}

export const enum ExchangeId {
  binance = 1
}

export const enum MethodType {
  subscribe = 1,
  unsubscribe = 2,
  call = 3
}

export const enum Method {
  market_start = 1,
  subscribeMarket = 2,
  unsubscribeMarket = 3,
  subscribeOrderBook = 11,
  unsubscribeOrderBook = 12,
  market_end = 100
}
