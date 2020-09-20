import Vue from "vue";

Vue.prototype.$methodType = {
  subscribe: 1,
  unsubscribe: 2,
  call: 3,
  callList: 4
};

Vue.prototype.$method = {
  market_start: 1,
  subscribeMarket: 2,
  unsubscribeMarket: 3,
  subscribeOrderBook: 11,
  unsubscribeOrderBook: 12,
  market_end: 100
};
