import { ExchangeId } from "@src/common/constants";
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