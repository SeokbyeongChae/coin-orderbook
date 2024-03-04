import Vue from "vue";

export const state = () => ({
  connectionStatus: Vue.prototype.$connectionStatuses.disconnected,
});

export const mutations = {
  setConnectionStatus(state, status) {
    state.connectionStatus = status;
  },
};

export const getters = {
  isDisconnected(state) {
    return state.connectionStatus === Vue.prototype.$connectionStatuses.disconnected;
  },

  isConnected(state) {
    return state.connectionStatus === Vue.prototype.$connectionStatuses.connected;
  },

  isConnecting(state) {
    return state.connectionStatus === Vue.prototype.$connectionStatuses.connecting;
  },
};