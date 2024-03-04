<template>
  <div>
    <nuxt />
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("context", ["isConnected"]),
  },
  watch: {
    isConnected() {
      if (!this.isConnected) return;
      
      this.subscribeMarket();
      this.subscribeOrderBook({ market: "ETH/BTC" });
    },
  },
  created() {
    this.$connect();
  },
  mounted() {
    //
  },
  methods: {
    ...mapActions("market", { subscribeMarket: "subscribe"}),
    ...mapActions("order-book", { subscribeOrderBook: "subscribe"}),
  }
};
</script>

<style></style>
