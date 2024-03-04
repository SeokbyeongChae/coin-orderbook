import Vue from "vue";

class OrderBook {
  market = undefined;
  asks = undefined;
  bids = undefined;

  constructor(data) {
    this.update(data);
  }

  update(data) {
    this.market = data.market;
    this.asks = data.marketOrderBook.askMap;
    this.bids = data.marketOrderBook.bidMap;
  }
}

export const state = () => ({
  orderBook: undefined,
});

export const mutations = {
  updateOrderBook(state, data) {
    if (!state.orderBook) {
      state.orderBook = new OrderBook(data);
      return;
    }

    state.orderBook.update(data);
  },
};

export const actions = {
  subscribe({ rootGetters }, { market }) {
    if (!rootGetters["context/isConnected"]) return;

    Vue.prototype.$sendMessage(Vue.prototype.$requestTypes.SUBSCRIBE, "order-book", undefined, { market });
  },

  handleMessage({ state, rootState, commit, dispatch }, { requestInfo, message }) {
    // console.log('notification/handleMessage')
    const sentMessage = requestInfo.payload;

    switch (message.result) {
      case Vue.prototype.$resultTypes.OK: {
        switch (sentMessage.type) {
          case Vue.prototype.$requestTypes.SUBSCRIBE: {
            switch (sentMessage.method) {
              case undefined: {
                commit("updateOrderBook", message.data);
                break;
              }
            }
            break;
          }
          case Vue.prototype.$requestTypes.CALL: {
            switch (sentMessage.method) {
              case "": {
                break;
              }
            }
            break;
          }
          case Vue.prototype.$requestTypes.CALL_LIST: {
            switch (sentMessage.method) {
              case "": {
                break;
              }
            }
            break;
          }
        }
        break;
      }
      case Vue.prototype.$resultTypes.ERROR: {
        alert(message);
        break;
      }
    }
  },
};

export const getters = {};
