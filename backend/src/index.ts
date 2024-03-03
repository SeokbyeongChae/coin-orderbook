import Server from "./server";

const main = () => {
  const server = new Server();

  server.connectEngine()
  server.run(4000);
}

main()