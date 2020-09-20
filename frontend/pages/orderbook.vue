<template>
  <div>
    <h2>Order Book</h2>
    <div v-if="orderBook">
      <h3>{{ orderBook.market }}</h3>
      <v-row>
        <v-col cols="12">
          <!-- <v-combobox v-model="select" :items="items" label="Combobox" multiple outlined dense></v-combobox> -->
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <OrderBook :items="orderBook.asks" />
        </v-col>
        <v-col>
          <OrderBook :items="orderBook.bids" />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { OrderBook } from "@/components/OrderBook";

export default {
  components: {
    OrderBook
  },
  computed: {
    ...mapState("market", ["orderBook", "marketInfoMap"])
  },
  watch: {
    orderBook: {
      deep: true,
      handler() {
        // console.log("updateOrderBook");
        // console.dir(this.orderBook);
      }
    }
    // marketInfoMap: {
    //   deep: true,
    //   handler() {
    //     console.log("updateMarketInfoMap");
    //     console.dir(this.marketInfoMap);
    //   }
    // }
  },
  mounted() {
    // this.$store.dispatch("market/subscribeOrderBook", { market: "ETH/BTC" });
  }
};
</script>

<style>
</style>