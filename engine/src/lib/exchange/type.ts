export enum ExchangeId {
  binance = 1,
  coinbase = 2,
  bitfinex = 3
}

export enum ExchangeStatus {
  Idle = 1,
  Initialized = 2,
  Running = 3,
  Disconnected = 4
}

export interface ExchangeEvents {
  updateStatus: (status: ExchangeStatus) => void;
  updateOrderBookByDataset: () => void;
  updateOrderBook: () => void;
}