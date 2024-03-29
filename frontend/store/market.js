import Vue from "vue";

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

export const state = () => ({
  marketInfoMap: new Map()
});

export const mutations = {
  updateMarketInfo(state, data) {
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
  subscribe({ rootGetters }) {
    if (!rootGetters["context/isConnected"]) return;

    Vue.prototype.$sendMessage(Vue.prototype.$requestTypes.SUBSCRIBE, "market", undefined);
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
                console.log('subscribe market...')
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
