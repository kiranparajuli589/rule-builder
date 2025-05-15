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
        @update:selected="onFieldChange"
      />
      <div
        v-if="localPattern.field === RULE_FIELDS.URI_PATH"
        style="padding-top: 1.7rem;"
      >
        <CInputCheckbox
          :checked="localPattern.withFn"
          :label="$t('ruleBuilder.useFn')"
          class="pattern-type-checkbox"
          @update:checked="switchType($event)"
        />
      </div>
    </div>

    <!-- Dynamic value input based on field type when not using function -->
    <div v-if="!localPattern.withFn">
      <!-- Select dropdown for fields with options -->
      <SelectDropdown
        v-if="fieldMeta.type === 'select'"
        :selected.sync="localPattern.value"
        :options="fieldMeta.options || []"
        :placeholder="fieldMeta.placeholder"
        class="value-section"
        :label="$t('ruleBuilder.value')"
      />

      <!-- Number input for number fields -->
      <CInput
        v-else-if="fieldMeta.type === 'number'"
        type="number"
        v-model="localPattern.value"
        :placeholder="fieldMeta.placeholder"
        class="value-section"
        :label="$t('ruleBuilder.value')"
        :min="fieldMeta.min"
        :max="fieldMeta.max"
        :step="fieldMeta.step"
        required
        @blur="onValueBlur"
        @input="onValueInput"
        :is-valid="valueTouched ? isValueValid : undefined"
        :invalid-feedback="valueError"
      />

      <!-- Default text input for other field types -->
      <CInput
        v-else
        v-model="localPattern.value"
        :placeholder="fieldMeta.placeholder || $t('ruleBuilder.enterReplacementValue')"
        class="value-section"
        :label="$t('ruleBuilder.value')"
        required
        @blur="onValueBlur"
        @input="onValueInput"
        :is-valid="valueTouched ? isValueValid : undefined"
        :invalid-feedback="valueError"
      />
    </div>

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
          class="flex-grow-1"
          required
          @blur="onFnArgBlur"
          @input="onFnArgInput"
          :is-valid="fnArgTouched ? isFnArgValid : undefined"
          :invalid-feedback="fnArgError"
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
import { RULE_FIELDS } from "@/views/domain/rule-builder/ConditionService";
import { mapState } from "vuex";

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
      functions: RuleService.rewriteFunctions,

      valueTouched: false,
      fnArgTouched: false,
      valueError: null,
      fnArgError: null
    };
  },
  computed: {
    RULE_FIELDS() {
      return RULE_FIELDS
    },
    RuleService() {
      return RuleService;
    },
    functionDescription() {
      if (!this.localPattern.fn) return '';
      const fn = this.functions.find(f => f.value === this.localPattern.fn);
      return fn ? fn.description : '';
    },
    isValueValid() {
      return !this.valueError;
    },
    isFnArgValid() {
      return !this.fnArgError;
    },
    // Add field and fieldMeta computed properties
    field() {
      return RuleService.fields.find(f => f.value === this.localPattern.field);
    },
    fieldMeta() {
      return this.field ? (this.field.meta || {}) : {};
    },
    ...mapState('ruleBuilder', ['showDialog']),
  },
  watch: {
    showDialog(newVal, oldVal) {
      if (!newVal & oldVal) {
        this.resetStates();
      }
    },
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
    },
    'localPattern.withFn': function(newVal) {
      // Reset touched states when switching between types
      if (newVal) {
        this.valueTouched = false;
      } else {
        this.fnArgTouched = false;
      }
    }
  },
  methods: {
    switchType(field) {
      this.localPattern.withFn = field;
    },

    onFieldChange() {
      // Reset value when field changes to prevent invalid data
      this.localPattern.value = '';
      this.valueError = null;
      this.valueTouched = false;
    },

    // Value field validation methods
    onValueBlur() {
      this.valueTouched = true;
      this.validateValue();
    },

    onValueInput() {
      if (this.valueTouched) {
        this.validateValue();
      }
    },

    validateValue() {
      this.valueError = null;

      // Check if field has a validate function in the field definition
      if (this.field && this.field.validate) {
        this.valueError = this.field.validate(this.localPattern.value);
      }
      // Basic validation - required field
      else if (!this.localPattern.value && this.localPattern.value !== 0) {
        this.valueError = this.$t('validation.required');
      }

      return !this.valueError;
    },

    // Function argument validation methods
    onFnArgBlur() {
      this.fnArgTouched = true;
      this.validateFnArg();
    },

    onFnArgInput() {
      if (this.fnArgTouched) {
        this.validateFnArg();
      }
    },

    validateFnArg() {
      this.fnArgError = null;
      if (!this.localPattern.fnArg && this.localPattern.fnArg !== 0) {
        this.fnArgError = this.$t('validation.required');
      }
      return !this.fnArgError;
    },

    initializeFromProps() {
      const oldPattern = JSON.stringify(this.localPattern);
      this.localPattern = JSON.parse(JSON.stringify(this.pattern || {}));

      // Set default field if not provided
      if (!this.localPattern.field) {
        this.localPattern.field = RuleService.fields[0]?.value;
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

      // Reset touched states on complete pattern change
      const newPattern = JSON.stringify(this.localPattern);
      if (oldPattern !== newPattern) {
        this.valueTouched = false;
        this.fnArgTouched = false;

        // If values exist, validate them but don't mark as touched
        if (this.localPattern.value && this.localPattern.value.length > 0) {
          this.validateValue();
        }

        if (this.localPattern.fnArg && this.localPattern.fnArg.length > 0) {
          this.validateFnArg();
        }
      }
    },
    resetStates() {
      this.localPattern = {};
      this.valueTouched = false;
      this.fnArgTouched = false;
      this.valueError = null;
      this.fnArgError = null;
    }
  }
}
</script>

<style lang="scss" scoped>
.replace-pattern-builder {
  .pattern-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    align-items: flex-start;
  }

  .field-select {
    min-width: 200px;
  }

  .value-section {
    margin-bottom: 1rem;
  }

  .function-section {
    .function-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .function-description {
      margin-top: 0.5rem;
      font-style: italic;
      color: #666;
      font-size: 0.9rem;
    }
  }
  
  .form-select-dropdown.value-section {
    gap: 0;
  }
}
</style>