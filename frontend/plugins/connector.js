import Vue from "vue";
import msgpack from "msgpack-lite";

export default ({ app }) => {
  let client;
  let requestId = 0;
  const requestMap = new Map();

  const connect = () => {
    console.log("connecting..");

    // TODO: need to change to config file
    client = new WebSocket("ws://127.0.0.1:4000/ws");

    client.onopen = connected;
    client.onclose = retry;
    client.onmessage = messageHandler;
  };

  const send = (type, component, method, params, tempData) => {
    if (!app.store.getters["context/isConnected"]) return;

    const payload = {
      reqId: ++requestId,
      type,
      component,
      method,
      params
    }

    client.send(msgpack.encode(payload));
    console.log("send", payload);

    requestMap.set(requestId, {
      payload,
      tempData,
    });

    if (requestId >= Number.MAX_SAFE_INTEGER) requestId = 100000;
  };

  const retry = () => {
    app.store.commit("context/setConnectionStatus", Vue.prototype.$connectionStatuses.connecting);
    connect();
  };

  const connected = () => {
    console.log("connected..");
    client.binaryType = "arraybuffer";
    app.store.commit("context/setConnectionStatus", Vue.prototype.$connectionStatuses.connected);
  };

  const messageHandler = (rawData) => {
    let message;
    try {
      message = JSON.parse(msgpack.decode(new Uint8Array(rawData.data)));
    } catch (err) {
      console.error("corrupted receive message", rawData.data);
      return;
    }

    // console.log(message.id, message.result, message.data);

    /*
      id: requestId,
      result: resultType,
      data: responseData
    */

    const requestId = message.id;
    const requestInfo = requestMap.get(requestId);
    if (!requestInfo || !requestInfo.payload) {
      console.log("cannot find origin message");
      return;
    }


    app.store.dispatch(`${requestInfo.payload.component}/handleMessage`, {
      requestInfo,
      message,
    });
  };

  Vue.prototype.$connect = connect;
  Vue.prototype.$sendMessage = send;
};
