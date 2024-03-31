<template>
  <div class="app">
    <Editor v-model="state"></Editor>
  </div>
</template>

<script>
import { provide, ref } from "vue"
import data from "./data.json"
import Editor from "./packages/editor"
import { registerConfig as config } from "./utils/editor-config"

export default {
  name: 'App',
  components: {
    Editor
  },
  setup() {
    const state = ref(data)

    provide('config', config)

    return {
      state
    }
  }
}
</script>

<style lang="scss">
.app {
  position: fixed;
  left: 20px;
  right: 20px;
  top: 20px;
  bottom: 20px;
}
</style>
