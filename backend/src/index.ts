import "dotenv/config"
import Server from "@src/server";

const main = () => {
  const server = new Server();

  server.connectEngine()
  server.run(4000);
}

main()