import Vue from "vue";

export default (ctx, inject) => {
  inject("bus", new Vue());
};
