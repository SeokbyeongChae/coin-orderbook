import Vue from "vue";

Vue.prototype.$requestTypes = {
  SUBSCRIBE: 1,
  UNSUBSCRIBE: 2,
  CALL: 3,
  CALL_LIST: 4,
};

Vue.prototype.$connectionStatuses = {
  disconnected: 0,
  connecting: 1,
  connected: 2,
};

Vue.prototype.$resultTypes = {
  OK: 1,
  ERROR: 2,
};

Vue.prototype.$commonState = {
  DISABLED: 0,
  ENABLED: 1,
};

/*
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
*/