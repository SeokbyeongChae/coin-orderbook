import Vue from "vue";
import msgpack from "msgpack-lite";

export default (context, inject) => {
  let ws;

  const sendMessage = (type, method, params) => {
    if (!ws) return;

    console.log(
      `sendMessage: ${JSON.stringify({
        type,
        method,
        params
      })}`
    );

    ws.send(
      msgpack.encode({
        type,
        method,
        params
      })
    );
  };

  const connect = (url, vuex) => {
    ws = new WebSocket("ws://localhost:4000");

    ws.onopen = () => {
      console.log("connect to websock..");
      context.$bus.$emit("connect");
    };

    ws.onmessage = rawMessage => {
      try {
        const message = JSON.parse(rawMessage.data);
        // console.log(`receive message: ${JSON.stringify(message)}`);

        const method = message.method;
        if (
          method > Vue.prototype.$method.market_start &&
          method < Vue.prototype.$method.market_end
        ) {
          vuex.dispatch("market/messageHandler", message);
        }
      } catch (err) {
        console.log(`message error: ${err}`);
      }
      // console.dir(msgpack.decode(message.data));
      // console.dir(msgpack.decode(message.data));
    };
  };

  inject("connectWS", connect);
  inject("sendMessage", sendMessage);
};
