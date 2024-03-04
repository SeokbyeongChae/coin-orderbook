export const enum EngineMethod {
  OrderBook = "orderBook",
  UpdateOrderBook = "updateOrderBook",
  MarketList = "marketList"
}

export interface EngineMessage {
  method: EngineMethod,
  data: any
}