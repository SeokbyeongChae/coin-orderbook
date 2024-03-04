import { IPC } from "node-ipc";

import { EngineMethod } from "./type";
export * from "./type"

export default class IPCServer {
  private ipc = new IPC();
  private processSet: Set<any> = new Set();

  constructor() {
    this.ipc.config.id = "engine";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;
  }

  public startPipeline() {
    this.ipc.serve(() => {
      this.ipc.server.on("connect", (socket: any) => {
        this.processSet.add(socket);
        console.log("connectors: ", this.processSet.size);
      });

      this.ipc.server.on("socket.disconnected", (socket: any) => {
        this.processSet.delete(socket);
        console.log("connectors: ", this.processSet.size);
      });
    });

    this.ipc.server.start();
  }

  public addEventListener(method: EngineMethod, callback: (msg: any, socket: any) => void ) {
    this.ipc.server.on(method, callback);
  }

  public broadcastEngineMessage(method: string, data: any) {
    for (const socket of this.processSet) {
      this.ipc.server.emit(socket, "message", { method, data });
    }
  }
  
  public sendMessage(socket: any, method: EngineMethod, data: any) {
    this.ipc.server.emit(socket, "message", { method, data });
  }
}