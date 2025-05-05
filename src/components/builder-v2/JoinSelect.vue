<template>
  <select
    v-model="localSelected"
    class="join-select"
  >
    <option value="&&">AND</option>
    <option value="||">OR</option>
  </select>
</template>
<script>
import RuleService from "@//services/RuleService.js";

export default {
  computed: {
    RuleService() {
      return RuleService
    }
  },
  props: {
    selected: {
      type: String,
      required: true,
    }
  },
    data() {
      return {
        localSelected: this.selected
      };
    },
    watch: {
      selected: {
        immediate: true,
        handler(newVal, oldVal) {
          if (newVal !== oldVal) {
            this.localSelected = newVal;
          }
        }
      },
      localSelected: {
        handler(newVal, oldVal) {
          if (newVal !== oldVal) {
            this.$emit('update:selected', newVal);
          }
        }
      }
    },
    methods: {
      onChange() {

      }
    }
}
</script>