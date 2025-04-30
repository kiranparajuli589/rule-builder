<template>
  <div class="replace-pattern-builder">
    <div class="pattern-row">
      <div class="field-section">
        <label>Field</label>
        <select v-model="localPattern.field" class="field-select">
          <option v-for="field in RuleService.fields" :key="field" :value="field">{{ field }}</option>
        </select>
      </div>

      <div class="pattern-type-section">
        <label>Pattern Type</label>
        <div class="radio-group">
          <label class="radio-label">
            <input
              type="checkbox"
              v-model="localPattern.withFn"
              value="value"
              @change="switchType($event.target.value)"
            >
            Use Fn?
          </label>
        </div>
      </div>
    </div>

    <div v-if="!localPattern.withFn" class="value-section">
      <label>Value</label>
      <input
        type="text"
        v-model="localPattern.value"
        placeholder="Enter the replacement value"
        class="value-input"
      />
    </div>

    <div v-else class="function-section">
      <div class="function-row">
        <div class="function-select-container">
          <label>Function</label>
          <select v-model="localPattern.fn" class="function-select">
            <option v-for="fn in functions" :key="fn.value" :value="fn.value">{{ fn.label }}</option>
          </select>
        </div>

        <div class="function-arg-container">
          <label>Function Argument - {{localPattern.fnArg}}</label>
          <input
            type="text"
            v-model="localPattern.fnArg"
            placeholder="Function argument"
            class="function-arg-input"
          />
        </div>
      </div>

      <div v-if="functionDescription" class="function-description">
        {{ functionDescription }}
      </div>
    </div>
  </div>
</template>

<script>
import RuleService from "@//services/RuleService.js";

export default {
  name: 'ReplacePatternBuilder',
  props: {
    pattern: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localPattern: {
        field: '',
        value: '',
        fn: '',
        fnArg: '',
        withFn: false,
      },
      functions: [
        { value: 'concat', label: 'Concatenate', description: 'Concatenates the argument to the end of the field value' },
        { value: 'substring', label: 'Substring', description: 'Returns a subset of the field value from index 0 to the argument value' }
      ]
    };
  },
  computed: {
    RuleService() {
      return RuleService
    },
    functionDescription() {
      if (!this.localPattern.fn) return '';
      const fn = this.functions.find(f => f.value === this.localPattern.fn);
      return fn ? fn.description : '';
    }
  },
  watch: {
    pattern: {
      handler(newValue) {
        if (JSON.stringify(newValue) !== JSON.stringify(this.localPattern)) {
          this.initializeFromProps();
        }
      },
      deep: true,
      immediate: true
    },
    localPattern: {
      handler(newV) {
        this.$emit('update:pattern', newV);
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    switchType(field) {
      console.log(field);
    },
    initializeFromProps() {
      this.localPattern = JSON.parse(JSON.stringify(this.pattern || {}));

      // Set default field if not provided
      if (!this.localPattern.field) {
        this.localPattern.field = RuleService.fields[0];
      }

      // Determine pattern type
      if (this.localPattern.fn) {
        this.localPattern.type = 'function';
      } else {
        this.localPattern.type = 'value';
        if (this.localPattern.value === undefined) {
          this.localPattern.value = '';
        }
      }
    },
  }
}
</script>