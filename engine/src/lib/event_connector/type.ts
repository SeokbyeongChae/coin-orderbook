export const enum EngineMethod {
  OrderBook = "orderBook",
  UpdateOrderBook = "updateOrderBook",
  MarketList = "marketList"
}

export interface EventMessage {
  method: EngineMethod,
  data: any
}