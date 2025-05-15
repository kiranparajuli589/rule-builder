<template>
  <div class="replace-pattern-builder">
    <div class="pattern-row">
      <SelectDropdown
        :selected.sync="localPattern.field"
        :options="RuleService.fields"
        :placeholder="$t('ruleBuilder.selectField')"
        menu-width="fit-content"
        class="field-select"
        :label="$t('ruleBuilder.field')"
      />
      <div style="padding-top: 1.7rem;">
        <CInputCheckbox
          :checked="localPattern.withFn"
          :label="$t('ruleBuilder.useFn')"
          class="pattern-type-checkbox"
          @update:checked="switchType($event)"
        />
      </div>
    </div>

    <CInput
      v-if="!localPattern.withFn"
      class="value-section"
      :label="$t('ruleBuilder.value')"
      :placeholder="$t('ruleBuilder.enterReplacementValue')"
      v-model="localPattern.value"
      required
    />

    <div v-else class="function-section">
      <div class="function-row">
        <SelectDropdown
          :selected.sync="localPattern.fn"
          :options="functions"
          :placeholder="$t('ruleBuilder.selectFunction')"
          menu-width="fit-content"
          :label="$t('ruleBuilder.function')"
        />

        <CInput
          :label="$t('ruleBuilder.functionArgument')"
          :placeholder="$t('ruleBuilder.enterFunctionArgument')"
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
        { 
          value: 'concat',
          label: 'Concatenate',
          description: this.$t('ruleBuilder.concatDescription')
        },
        { 
          value: 'substring',
          label: 'Substring',
          description: this.$t('ruleBuilder.substringDescription')
        }
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