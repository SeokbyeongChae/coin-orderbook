import { IPC } from "node-ipc";

import { EngineMethod, EngineMessage } from "./type";
export * from "./type";

export default class EngineConnector {
  private ipc = new IPC();

  constructor() {
    this.ipc.config.id = "client";
    this.ipc.config.retry = 1500;
    this.ipc.config.silent = true;
  }

  public connect(callback: (msg: any) => void) {
    this.ipc.connectTo("engine", () => {
      this.ipc.of.engine.on("connect", (msg: any) => {
        callback(msg);
      });
    });
  }

  public requestEngineData(method: string, param?: any) {
    if (!this.ipc.of.engine) {
      throw Error("engine connector is not initialized");
    }

    this.ipc.of.engine.emit(method, param);
  }

  public registerEventListener(callback: (msg: EngineMessage) => void) {
    if (!this.ipc.of.engine) {
      throw Error("engine connector is not initialized");
    }

    this.ipc.of.engine.on("message", callback);
  }
}