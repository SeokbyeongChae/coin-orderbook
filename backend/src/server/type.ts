export interface MessageData {
  reqId: string,
  component: RouteComponent,
  method: string,
  type: MessageType,
  params: any,
}

export interface Subscriber {
  reqId: string,
  compare?: Function
}

export enum RouteComponent {
  Market = 'market',
  OrderBook = 'order-book',
}

export enum MessageType {
  Subscribe = 1,
  Unsubscribe = 2,
  Call = 3,
  CallList = 4,
};

export enum ResultType  {
  OK = 1,
  Error = 2,
};

export enum SubscribeMethod {
  OrderBook = 'order-book',
  Market = 'market',
}