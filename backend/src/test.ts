import StreamServer from "./streamServer";

const streamServer = new StreamServer();
if (streamServer.connectEngine()) {
  console.log("start server..");
  streamServer.start();
}
