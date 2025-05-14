<template>
  <div class="replace-pattern-builder">
    <div class="pattern-row">
      <SelectDropdown
        :selected.sync="localPattern.field"
        :options="RuleService.fields"
        :placeholder="$t('selectField')"
        menu-width="fit-content"
        class="field-select"
        :label="$t('field')"
      />
      <div style="padding-top: 1.7rem;">
        <CInputCheckbox
          :checked="localPattern.withFn"
          :label="$t('useFn')"
          class="pattern-type-checkbox"
          @update:checked="switchType($event)"
        />
      </div>
    </div>

    <CInput
      v-if="!localPattern.withFn"
      class="value-section"
      :label="$t('value')"
      :placeholder="$t('enterReplacementValue')"
      v-model="localPattern.value"
      required
    />

    <div v-else class="function-section">
      <div class="function-row">
        <SelectDropdown
          :selected.sync="localPattern.fn"
          :options="functions"
          :placeholder="$t('selectFunction')"
          menu-width="fit-content"
          :label="$t('function')"
        />

        <CInput
          :label="$t('functionArgument')"
          :placeholder="$t('enterFunctionArgument')"
          v-model="localPattern.fnArg"
          class="flex-grow-1" required
        />
      </div>

      <div v-if="functionDescription" class="function-description">
        {{ functionDescription }}
      </div>
    </div>
  </div>
</template>

<script>
import RuleService from "./RuleService.js";

export default {
  name: 'ReplacePatternBuilder',
  components: { 
    SelectDropdown: () => import("@/components/SelectDropdown.vue")
  },
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
      this.localPattern.withFn = field;
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