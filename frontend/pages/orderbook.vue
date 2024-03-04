<template>
  <div class="orderBook">
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
          <orderBookTable :items="orderBook.asks" />
        </v-col>
        <v-col>
          <orderBookTable :items="orderBook.bids" />
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import orderBookTable from "@/components/orderBookTable.vue";

export default {
  components: {
    orderBookTable
  },
  computed: {
    ...mapState("order-book", ["orderBook", "marketInfoMap"])
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

<style lang="scss" scoped>
.orderBook {
  padding: 12px 32px; 
}
</style>