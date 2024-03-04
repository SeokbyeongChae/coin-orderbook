<template>
  <v-simple-table dense class="orderBookTable">
    <template v-if="items" v-slot:default>
      <thead>
        <tr>
          <th class="text-left price">Price</th>
          <th class="text-left amount">Amount</th>
          <th class="text-left exchanges">Exchage List</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item[0]">
          <td>{{ item[1].bgPrice }}</td>
          <td>{{ item[1].bgTotalAmount }}</td>
          <td>{{ item[1].exchangeList }}</td>
        </tr>
      </tbody>
    </template>
  </v-simple-table>
</template>

<script>
export default {
  name: 'OrderBookTable',
  props: {
    items: {
      type: Array
      // required: true
    }
  }
};
</script>

<style lang="scss" scoped>
.orderBookTable{
  .price {
    width: 140px;
  }

  .amount {
    width: 140px;
  }

  .exchanges {
    //
  }
}
</style>