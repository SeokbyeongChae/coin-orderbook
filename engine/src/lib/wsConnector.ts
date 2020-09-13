import WebSocket from "ws";
import { TypedEmitter } from "tiny-typed-emitter";

export enum WebSocketStatuses {
  idle = 1,
  running = 2,
}

interface ExchangeEvents {
  updateStatus: (status: WebSocketStatuses) => void;
  open: () => void;
  message: (data: any) => void;
  close: () => void;
  error: (err: any) => void;
}

export default class WSConnector extends TypedEmitter<ExchangeEvents> {
  private url: string;
  protected ws: WebSocket | undefined;

  constructor(url: string) {
    super();
    this.url = url;
  }

  private createWebSocket(url: string): WebSocket {
    const ws = new WebSocket(url);

    ws.onopen = (data: any) => {
      this.emit("open");
    };

    ws.onmessage = (data: any) => {
      this.emit("message", data);
    };

    ws.onclose = () => {
      this.emit("close");
    };

    ws.onerror = (err: any) => {
      this.emit("error", err);
    };

    return ws;
  }

  public start(): void {
    this.ws = this.createWebSocket(this.url);
  }

  public stop(): void {
    if (!this.ws) return;

    this.ws.terminate();
  }

  public sendMessage(data: any): void {
    if (!this.ws) return;

    this.ws.send(data);
  }
}

// const test = new WSConnector("wss://stream.binance.com:9443/ws");
// test.start();

class BinanceWSConnector extends WSConnector {}

const test = new BinanceWSConnector("wss://stream.binance.com:9443/ws");
test.start();
