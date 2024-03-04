import Vue from "vue";

export const state = () => ({});

export const mutations = {};

export const actions = {
  handleMessage({ state, rootState, commit, dispatch }, { requestInfo, message }) {
    const sentMessage = requestInfo.payload;
    console.log('notification/handleMessage')
  }
  // messageHandler({ dispatch, commit, state }, response) {
  //   console.log("receive notification message..");
  //   switch (response.methodType) {
  //     case Vue.prototype.$methodType.subscribe: {
  //       break;
  //     }
  //     case Vue.prototype.$methodType.unsubscribe: {
  //       break;
  //     }
  //     case Vue.prototype.$methodType.call: {
  //       break;
  //     }
  //   }
  // }
};

export const getters = {};
