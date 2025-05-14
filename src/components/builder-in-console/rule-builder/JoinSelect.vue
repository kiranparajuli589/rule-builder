<template>
  <SelectDropdown
    :options="RuleService.joinOperators"
    v-model="localSelected"
    class="join-select"
    :placeholder="$t('domain.JoinOperator')"
  />
</template>
<script>
import RuleService from "./RuleService.js";
import SelectDropdown from "@/components/SelectDropdown.vue";

export default {
  components: { SelectDropdown },
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