<template>
  <div>
    <nuxt />
  </div>
</template>

<script>
export default {
  mounted() {
    this.$connectWS("tu", this.$store);
    this.$bus.$on("connect", () => {
      console.log("connect websocket..");
      this.$store.dispatch("market/subscribeMarket");
      this.$store.dispatch("market/subscribeOrderBook", { market: "ETH/BTC" });
    });
  }
};
</script>

<style></style>
