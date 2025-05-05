<template>
  <div class="">
    <div class="field-operator-value">
      <select
        v-model="localCondition.field"
        :value="localCondition.field"
        class="field-select"
      >
        <option v-for="field in RuleService.fields" :key="field" :value="field">{{ field }}</option>
      </select>

      <select v-model="localCondition.operator" class="operator-select">
        <option v-for="op in RuleService.operators" :key="op" :value="op">{{ op }}</option>
      </select>

      <input
        type="text"
        v-model="localCondition.value"
        placeholder="Values"
        class="value-input"
      />
    </div>

    <!-- Delete button for regular condition -->
    <button
      v-if="showRemove"
      type="button"
      class="delete-btn"
      @click="removeCondition()"
    >
      ✕
    </button>
  </div>
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
    showRemove: {
      type: Boolean,
      required: true,
    },
    condition: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      localCondition: JSON.parse(JSON.stringify(this.condition))
    };
  },
  watch: {
    condition: {
      handler(newValue) {
        // Only update local data if it's different from external prop
        // Using JSON.stringify is a simple way to deep compare objects
        if (JSON.stringify(newValue) !== JSON.stringify(this.localCondition)) {
          // Deep copy to avoid reference issues
          this.localCondition = JSON.parse(JSON.stringify(newValue));
        }
      },
      deep: true,
      immediate: true // Initialize on mount
    },
    localCondition: {
      handler(newValue) {
        console.log(newValue);
        this.$emit("update:condition", JSON.parse(JSON.stringify(newValue)));
      },
      deep: true,
    }
  },
  methods: {
    removeCondition() {
      this.$emit("remove");
    },
  },
}
</script>