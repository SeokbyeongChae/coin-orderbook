<template>
  <v-simple-table dense>
    <template v-if="items" v-slot:default>
      <thead>
        <tr>
          <th class="text-left">Price</th>
          <th class="text-left">Amount</th>
          <th class="text-left">Exchage List</th>
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
  props: {
    items: {
      type: Array
      // required: true
    }
  }
};
</script>

<style>
</style>