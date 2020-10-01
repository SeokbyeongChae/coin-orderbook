import Vue from "vue";

Vue.prototype.$methodType = {
  subscribe: 1,
  unsubscribe: 2,
  call: 3,
  callList: 4,
  notification: 10
};

Vue.prototype.$method = {
  market_start: 1,
  subscribeMarket: 2,
  unsubscribeMarket: 3,
  subscribeOrderBook: 11,
  unsubscribeOrderBook: 12,
  market_end: 100,
  notification_start: 20000,
  connected: 20001,
  ping: 20002,
  pong: 20003,
  notification_end: 20100
};
