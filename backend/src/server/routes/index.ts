import Server from "@src/server";
import { MessageData } from "../type";
import Client from "@src/client";

export default abstract class Router {
  protected server: Server;

  constructor(server: Server) {
    this.server = server;
  }

  public abstract process(message: MessageData, client: Client): void;
}