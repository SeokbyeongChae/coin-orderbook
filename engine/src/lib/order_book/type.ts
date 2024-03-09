import { ExchangeId } from "@src/lib/exchange";
import Big from "big.js";

export interface OrderBookDatasetItem {
  bgPrice: Big;
  bgAmount: Big | undefined;
}

export interface OrderBookDataset {
  exchangeId: ExchangeId;
  orderType: OrderType;
  baseAsset: string;
  quoteAsset: string;
  dataList: OrderBookDatasetItem[];
}

export enum OrderType {
  Ask,
  Bid
}