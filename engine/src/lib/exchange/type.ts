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