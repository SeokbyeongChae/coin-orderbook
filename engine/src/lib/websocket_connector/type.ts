export enum WebSocketStatus {
  Idle,
  Running
}

export interface ExchangeEvents {
  updateStatus: (status: WebSocketStatus) => void;
  open: () => void;
  message: (data: any) => void;
  close: () => void;
  error: (err: any) => void;
}
