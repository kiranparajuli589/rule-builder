<template>
  <div class="replace-pattern-builder">
    <div class="pattern-row">
      <select-dropdown
        :selected="replacePattern.field || ''"
        :options="RuleService.fields"
        :placeholder="$t('ruleBuilder.selectField')"
        menu-width="fit-content"
        class="field-select"
        :label="$t('ruleBuilder.field')"
        @update:selected="updateField"
      />
      <div
        v-if="replacePattern && replacePattern.field === RULE_FIELDS.URI_PATH"
        style="padding-top: 1.7rem;"
      >
        <a-checkbox
          :checked="replacePattern.withFn || false"
          @change="e => switchType(e.target.checked)"
        >
          {{ $t('ruleBuilder.useFn') }}
        </a-checkbox>
      </div>
    </div>

    <!-- Dynamic value input based on field type when not using function -->
    <div v-if="!replacePattern || !replacePattern.withFn">
      <!-- Select dropdown for fields with options -->
      <select-dropdown
        v-if="fieldMeta.type === 'select'"
        :selected="replacePattern.value || ''"
        :options="fieldMeta.options || []"
        :placeholder="fieldMeta.placeholder || $t('ruleBuilder.selectValue')"
        class="value-section"
        :label="$t('ruleBuilder.value')"
        @update:selected="updateValue"
      />

      <!-- Number input for number fields -->
      <CInput
        v-else-if="fieldMeta.type === 'number'"
        type="number"
        :value="replacePattern.value || ''"
        :placeholder="fieldMeta.placeholder || $t('ruleBuilder.enterNumberValue')"
        class="value-section"
        :label="$t('ruleBuilder.value')"
        :min="fieldMeta.min"
        :max="fieldMeta.max"
        :step="fieldMeta.step"
        required
        @blur="handleValueBlur"
        @input="handleValueInput($event)"
        :is-valid="valueTouched ? !valueError : undefined"
        :invalid-feedback="valueTouched ? valueError : undefined"
        :description="fieldMeta.valueDescription"
      />

      <!-- Default text input for other field types -->
      <CInput
        v-else
        :value="replacePattern.value || ''"
        :placeholder="fieldMeta.placeholder || $t('ruleBuilder.enterReplacementValue')"
        class="value-section"
        :label="$t('ruleBuilder.value')"
        required
        @blur="handleValueBlur"
        @input="handleValueInput($event)"
        :is-valid="valueTouched ? !valueError : undefined"
        :invalid-feedback="valueTouched ? valueError : undefined"
        :description="fieldMeta.valueDescription"
      />
    </div>

    <div v-else class="function-section">
      <div class="function-row">
        <select-dropdown
          :selected="replacePattern.fn || ''"
          :options="functions"
          :placeholder="$t('ruleBuilder.selectFunction')"
          menu-width="fit-content"
          :label="$t('ruleBuilder.function')"
          @update:selected="updateFunction"
        />

        <CInput
          :label="$t('ruleBuilder.functionArgument')"
          :placeholder="$t('ruleBuilder.enterFunctionArgument')"
          :value="replacePattern.fnArg || ''"
          class="flex-grow-1"
          required
          @blur="handleFnArgBlur"
          @input="handleFnArgInput($event)"
          :is-valid="fnArgTouched ? !fnArgError : undefined"
          :invalid-feedback="fnArgTouched ? fnArgError : undefined"
        />
      </div>

      <div v-if="functionDescription" class="function-description">
        {{ functionDescription }}
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import SelectDropdown from "@/components/SelectDropdown.vue";
import RuleService from "./RuleService.js";
import { RULE_FIELDS } from "./ConditionService";
import ConditionService from "./ConditionService";

export default {
  name: 'ReplacePatternBuilder',
  components: {
    SelectDropdown
  },
  data() {
    return {
      valueTouched: false,
      valueError: null,
      fnArgTouched: false,
      fnArgError: null
    };
  },
  computed: {
    ...mapState('ruleBuilder', ['rule', 'showDialog']),

    replacePattern() {
      if (!this.rule || !this.rule.replace_pattern) {
        return {
          field: '',
          value: '',
          withFn: false,
          fn: '',
          fnArg: ''
        };
      }

      return this.rule.replace_pattern ?? {};
    },

    RULE_FIELDS() {
      return RULE_FIELDS;
    },

    RuleService() {
      return RuleService;
    },

    functions() {
      return RuleService.rewriteFunctions;
    },

    functionDescription() {
      if (!this.replacePattern || !this.replacePattern.fn) return '';
      const fn = this.functions.find(f => f.value === this.replacePattern.fn);
      return fn ? fn.description : '';
    },

    field() {
      if (!this.replacePattern || !this.replacePattern.field) return null;
      return ConditionService.fields.find(f => f.value === this.replacePattern.field);
    },

    fieldMeta() {
      return this.field ? (this.field.meta || {}) : {};
    }
  },
  watch: {
    'replacePattern.field': function() {
      this.valueTouched = false;
      this.valueError = null;
    },
    'replacePattern.withFn': function() {
      this.valueTouched = false;
      this.valueError = null;
      this.fnArgTouched = false;
      this.fnArgError = null;
    },
    'replacePattern.fn': function() {
      this.fnArgTouched = false;
      this.fnArgError = null;
    },
    showDialog(newVal, oldVal) {
      if (!newVal & oldVal) {
        this.resetStates();
      }
    },
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'updateNestedValue',
      'validateRule'
    ]),

    switchType(checked) {
      this.updateNestedValue({
        path: ['replace_pattern', 'withFn'],
        value: checked
      });

      if (checked) {
        this.updateNestedValue({
          path: ['replace_pattern', 'value'],
          value: ''
        });
      } else {
        this.updateNestedValue({
          path: ['replace_pattern', 'fn'],
          value: ''
        });
        this.updateNestedValue({
          path: ['replace_pattern', 'fnArg'],
          value: ''
        });
      }

      this.validateRule();
    },

    updateField(value) {
      this.updateNestedValue({
        path: ['replace_pattern', 'field'],
        value
      });

      this.updateNestedValue({
        path: ['replace_pattern', 'value'],
        value: ''
      });

      this.validateRule();
    },

    updateValue(value) {
      this.updateNestedValue({
        path: ['replace_pattern', 'value'],
        value
      });

      this.valueTouched = true;

      this.validateValueField(value);

      this.validateRule();
    },

    handleValueBlur() {
      this.valueTouched = true;
      this.validateValueField(this.replacePattern.value);
      this.validateRule();
    },

    handleValueInput(event) {
      const value = event.target ? event.target.value : event;

      this.updateNestedValue({
        path: ['replace_pattern', 'value'],
        value
      });

      if (this.valueTouched) {
        this.validateValueField(value);
      }

      this.validateRule();
    },

    validateValueField(value) {
      this.valueError = null;

      if (!this.replacePattern || !this.replacePattern.field) return true;

      if (value === '' || value === undefined) {
        this.valueError = this.$t('validation.required');
        return false;
      }

      const fieldDef = ConditionService.fields.find(f => f.value === this.replacePattern.field);
      if (fieldDef && fieldDef.validate) {
        this.valueError = fieldDef.validate(value);
        if (this.valueError) return false;
      }

      return true;
    },

    updateFunction(value) {
      this.updateNestedValue({
        path: ['replace_pattern', 'fn'],
        value
      });

      this.updateNestedValue({
        path: ['replace_pattern', 'fnArg'],
        value: ''
      });

      this.validateRule();
    },

    handleFnArgBlur() {
      this.fnArgTouched = true;
      this.validateFnArg(this.replacePattern.fnArg);
      this.validateRule();
    },

    handleFnArgInput(event) {
      const value = event.target ? event.target.value : event;

      this.updateNestedValue({
        path: ['replace_pattern', 'fnArg'],
        value
      });

      if (this.fnArgTouched) {
        this.validateFnArg(value);
      }

      this.validateRule();
    },

    validateFnArg(value) {
      this.fnArgError = null;

      if (!this.replacePattern || !this.replacePattern.fn) return true;

      if (value === '' || value === undefined) {
        this.fnArgError = this.$t('validation.required');
        return false;
      }

      switch (this.replacePattern.fn) {
        case 'substring':
          if (isNaN(parseInt(value))) {
            this.fnArgError = this.$t('ruleBuilder.substringArgMustBeNumber');
            return false;
          }
          break;

        case 'replace':
          // add specific validation for replace function if needed
          break;

        case 'lowercase':
          // Usually no specific validation needed for lowercase
          break;
      }

      return true;
    },
    
    resetStates() {
      this.valueTouched = false;
      this.valueError = null;
      this.fnArgTouched = false;
      this.fnArgError = null;
    },
  }
};
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