<template>
  <div>Hello</div>
</template>

<script>
// const msgpack = require("msgpack/lib/msgpack.js");
//import msg from "msgpack/lib/msgpack.js";

export default {
  mounted() {
    const ws = new WebSocket("ws://localhost:4000");

    ws.onopen = () => {
      console.log("hello");
      const request = {
        method: "market/list"
      };
      // ws.send(msgpack.pack(request));
    };
  }
};
</script>

<style></style>
