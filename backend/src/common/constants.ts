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
  call = 3,
  notification = 10
}

export const enum Method {
  market_start = 1,
  subscribeMarket = 2,
  unsubscribeMarket = 3,
  subscribeOrderBook = 11,
  unsubscribeOrderBook = 12,
  market_end = 100,
  notification_start = 20000,
  connected = 20001,
  ping = 20002,
  pong = 20003,
  notification_end = 20100
}
