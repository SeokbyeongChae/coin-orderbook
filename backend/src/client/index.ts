import Server from "../server";
import msgpack from "msgpack-lite";
import { v4 as uuidv4 } from 'uuid';
import WebSocket from "ws";

import { ClientId } from "./type";
import { MessageData, ResultType } from "@src/server/type";
export * from "./type";

export default class Client {
  private ws: WebSocket;
  private server: Server;
  private id: ClientId;

  constructor(server: any, ws: WebSocket) {
    this.ws = ws;
    this.server = server;
    this.id = uuidv4();

    this.ws.onmessage = (message: any) => {
      if (message.byteLength > process.env.MAX_PAYLOAD_LENGTH) {
        console.error(`invalid payload size, client: ${this.id}, ${message.byteLength}`);
        return;
      }
      
      let decodedData;
      try {
        decodedData = msgpack.decode(message.data);
      } catch (err) {
        console.error(`failed to decode, client: ${this.id}, ${JSON.stringify(err)}`);
        return;
      }

      console.log(`message(client:${this.id}): ${decodedData}`);
      
      try {
        this.handleMessage(decodedData);
      } catch (err) {
        console.error(`failed to handler message, client: ${this.id}, ${JSON.stringify(err)}`);
      }
    };
  }

  private handleMessage(message: MessageData) {
    if (!this.server.routerMap.has(message.component)) {
      console.error(`invalid component, client:${this.id} ${message.component}`);
      return;
    }

    this.server.routerMap.get(message.component).process(message, this);
  }

  public sendMessage(requestId: string, resultType: ResultType, responseData: any) {
    const payload = JSON.stringify({
      id: requestId,
      result: resultType,
      data: responseData
    })

    try {
      this.ws.send(msgpack.encode(payload));
    } catch (e) {
      console.error(`failed to send message, client:${this.id}, ${JSON.stringify(e)}`);
      return;
    }
  }

  public getId() {
    return this.id;
  }
}
