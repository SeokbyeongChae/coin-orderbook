import Vue from "vue";

// import Msgpack from "msgpack";
class MarketInfo {
  market = undefined;
  exchangeList = undefined;

  constructor(data) {
    this.update(data);
  }

  update(data) {
    this.market = data[0];
    this.exchangeList = data[1];
  }
}

class OrderBook {
  market = undefined;
  asks = undefined;
  bids = undefined;

  constructor(data) {
    this.update(data);
  }

  update(data) {
    this.market = data.market;
    // if (data.marketOrderBook) {
    this.asks = data.marketOrderBook.askMap;
    this.bids = data.marketOrderBook.bidMap;
    // }
  }
}

export const state = () => ({
  orderBook: undefined,
  marketInfoMap: new Map()
});

export const mutations = {
  updateOrderBook(state, data) {
    if (!state.orderBook) {
      console.dir(data);
      state.orderBook = new OrderBook(data);
      return;
    }

    state.orderBook.update(data);
  },

  updateMarketInfo(state, data) {
    console.log("updateMarketInfo");
    const market = data[0];
    let marketInfo = state.marketInfoMap.get(market);
    if (!marketInfo) {
      marketInfo = new MarketInfo(data);
      state.marketInfoMap.set(market, marketInfo);
      return;
    }

    marketInfo.update(data);
  }
};

export const actions = {
  subscribeMarket({}) {
    const type = Vue.prototype.$methodType.subscribe;
    const method = Vue.prototype.$method.subscribeMarket;
    this.app.$sendMessage(type, method);
  },

  subscribeOrderBook({}, { market }) {
    const type = Vue.prototype.$methodType.subscribe;
    const method = Vue.prototype.$method.subscribeOrderBook;
    this.app.$sendMessage(type, method, { market });
  },

  messageHandler({ dispatch, commit, state }, response) {
    switch (response.methodType) {
      case Vue.prototype.$methodType.subscribe: {
        switch (response.method) {
          case Vue.prototype.$method.subscribeMarket: {
            // for (const marketInfo of response.data) {
            //   commit("updateMarketInfo", marketInfo);
            // }
            break;
          }
          case Vue.prototype.$method.subscribeOrderBook: {
            commit("updateOrderBook", response.data);
            break;
          }
        }
        break;
      }
      case Vue.prototype.$methodType.unsubscribe: {
        break;
      }
      case Vue.prototype.$methodType.call: {
        break;
      }
    }
  }
};

export const getters = {};
