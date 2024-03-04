export interface OrderBookManagerEvents {
  updateOrderBook: (orderBook: any) => void;
}

export enum OrderType {
  ask,
  bid
}