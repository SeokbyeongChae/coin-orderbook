import Engine from "@src/lib/engine";
import config from "../config/config.json";

const main = async () => {
  const engine = new Engine(config);
  engine.start();
}

main()