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
      JSON.stringify({
        type,
        method,
        params
      })
    );
    /*
    ws.send(
      msgpack.encode({
        type,
        method,
        params
      })
    );
    */
  };

  const connect = (url, vuex) => {
    // ws = new WebSocket(
    //   "ws://ec2-3-133-111-6.us-east-2.compute.amazonaws.com/ws"
    // );

    ws = new WebSocket("ws://127.0.0.1:4000/ws");

    ws.onopen = () => {
      console.log("connect to websock..");
      context.$bus.$emit("connect");
    };

    ws.onmessage = rawMessage => {
      // console.log(rawMessage.data);
      try {
        const message = JSON.parse(rawMessage.data);
        // console.log(`receive message: ${JSON.stringify(message)}`);

        const method = message.method;
        if (
          method > Vue.prototype.$method.market_start &&
          method < Vue.prototype.$method.market_end
        ) {
          vuex.dispatch("market/messageHandler", message);
        } else if (
          method > Vue.prototype.$method.notification_start &&
          method < Vue.prototype.$method.notification_end
        ) {
          vuex.dispatch("notification/messageHandler", message);
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
