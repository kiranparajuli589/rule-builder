<template>
  <div class="condition-inputs">
    <div class="field-operator-value">
      <select-dropdown
        :selected="condition.field"
        :options="fields"
        :placeholder="$t('ruleBuilder.selectField')"
        @update:selected="updateField"
        menu-width="fit-content"
        btn-width="245px"
        :label="showLabels ? $t('ruleBuilder.field') : undefined"
      />

      <select-dropdown
        :selected="condition.operator"
        :options="operators"
        :placeholder="$t('ruleBuilder.selectOperator')"
        @update:selected="updateOperator"
        menu-width="fit-content"
        :label="showLabels ? $t('ruleBuilder.operator') : undefined"
      />

      <div class="flex-grow-1">
        <select-dropdown
          v-if="fieldMeta.type === 'select'"
          :selected="condition.value"
          :options="fieldMeta.options || []"
          :placeholder="fieldMeta.placeholder"
          @update:selected="updateValue"
          :label="showLabels ? $t('ruleBuilder.value') : undefined"
          :description="showLabels ? fieldMeta.valueDescription : undefined"
        />

        <CInput
          v-else-if="fieldMeta.type === 'number'"
          type="number"
          :value="condition.value"
          :placeholder="fieldMeta.placeholder"
          class="value-input"
          :min="fieldMeta.min"
          :max="fieldMeta.max"
          :step="fieldMeta.step"
          required
          @blur="handleBlur"
          @input="handleInput($event)"
          :is-valid="fieldTouched ? !fieldError : undefined"
          :invalid-feedback="fieldTouched ? fieldError : undefined"
          :label="showLabels ? $t('ruleBuilder.value') : undefined"
          :description="showLabels ? fieldMeta.valueDescription : undefined"
        />

        <CInput
          v-else
          :value="condition.value"
          :placeholder="fieldMeta.placeholder ?? $t('ruleBuilder.enterValue')"
          class="value-input"
          required
          @blur="handleBlur"
          @input="handleInput($event)"
          :is-valid="fieldTouched ? !fieldError : undefined"
          :invalid-feedback="fieldTouched ? fieldError : undefined"
          :label="showLabels ? $t('ruleBuilder.value') : undefined"
          :description="showLabels ? fieldMeta.valueDescription : undefined"
        />
      </div>
    </div>

    <div class="action-buttons" :class="{ 'show-labels': showLabels }">
      <a-tooltip v-if="showCopyButton" placement="top" :title="$t('ruleBuilder.copyCondition')">
        <a-button
          type="primary"
          ghost
          class="copy-btn"
          @click="copyCondition"
        >
          <a-icon type="copy" />
        </a-button>
      </a-tooltip>

      <a-tooltip v-if="showRemove" placement="top" :title="$t('ruleBuilder.removeCondition')">
        <a-button
          type="danger"
          ghost
          class="delete-btn"
          @click="$emit('remove')"
        >
          <a-icon type="delete" />
        </a-button>
      </a-tooltip>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionService, { JOIN_OPERATOR } from "./ConditionService";

export default {
  name: 'ConditionInputs',
  components: {
    SelectDropdown
  },
  props: {
    conditionPath: {
      type: Array,
      required: true
    },
    showRemove: {
      type: Boolean,
      default: false
    },
    showLabels: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      fieldTouched: false,
      fieldError: null,
      defaultField: ConditionService.fields[0]?.value || '',
      defaultOperator: ConditionService.operators[0]?.value || ''
    };
  },
  computed: {
    ...mapGetters('ruleBuilder', [
      'getNestedValue'
    ]),

    condition() {
      return this.getNestedValue(this.conditionPath) || {};
    },

    fields() {
      return ConditionService.fields;
    },

    operators() {
      return ConditionService.operators;
    },

    field() {
      return this.fields.find(f => f.value === this.condition.field);
    },

    fieldMeta() {
      return this.field ? (this.field?.meta ?? {}) : {};
    },

    showCopyButton() {
      // Show copy button if field or operator is not default
      return (this.condition.field && this.condition.field !== this.defaultField) ||
        (this.condition.operator && this.condition.operator !== this.defaultOperator);
    },

    parentGroupPath() {
      // Extract the parent group path by removing the last part (index in conditions array)
      return this.conditionPath.slice(0, -1);
    }
  },
  watch: {
    'condition.field'() {
      this.fieldTouched = false;
      this.fieldError = null;
    },

    'condition.value': {
      handler(newValue) {
        if (this.fieldTouched) {
          this.validateField(newValue);
        }
      }
    }
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'updateNestedValue',
      'validateRule'
    ]),

    updateField(value) {
      this.updateNestedValue({
        path: [...this.conditionPath, 'field'],
        value
      });

      // Reset value when field changes
      this.updateNestedValue({
        path: [...this.conditionPath, 'value'],
        value: ''
      });

      // Reset touched state and error
      this.fieldTouched = false;
      this.fieldError = null;

      this.validateRule();
    },

    updateOperator(value) {
      this.updateNestedValue({
        path: [...this.conditionPath, 'operator'],
        value
      });

      this.validateRule();
    },

    updateValue(value) {
      this.updateNestedValue({
        path: [...this.conditionPath, 'value'],
        value
      });

      this.fieldTouched = true;

      this.validateField(value);

      this.validateRule();
    },

    handleBlur() {
      this.fieldTouched = true;

      this.validateField(this.condition.value);

      this.validateRule();
    },

    handleInput(event) {
      const value = event.target ? event.target.value : event;

      this.updateNestedValue({
        path: [...this.conditionPath, 'value'],
        value
      });

      if (this.fieldTouched) {
        this.validateField(value);
      }

      this.validateRule();
    },

    validateField(value) {
      this.fieldError = null;

      if (!this.field) return;

      if (this.field.validate) {
        this.fieldError = this.field.validate(value);
      } else if (value === '' || value === undefined) {
        this.fieldError = this.$t('validation.required');
      }

      return !this.fieldError;
    },

    copyCondition() {
      const currentCondition = this.condition;

      const newCondition = {
        id: '_' + Math.random().toString(36).substr(2, 9),  // Generate a new unique ID
        field: currentCondition.field,
        operator: currentCondition.operator,
        value: '',
        isGroup: false,
        joinOperator: currentCondition.joinOperator || JOIN_OPERATOR.AND
      };

      const parentPath = this.conditionPath.slice(0, -1);
      const currentIndex = parseInt(this.conditionPath[this.conditionPath.length - 1]);
      const conditions = [...(this.getNestedValue(parentPath) || [])];
      conditions.splice(currentIndex + 1, 0, newCondition);

      this.updateNestedValue({
        path: parentPath,
        value: conditions
      });

      this.validateRule();
    },
    
    generateId() {
      return '_' + Math.random().toString(36).substr(2, 9);
    }
  }
};
</script>

<style lang="scss" scoped>
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  
  &.show-labels {
    padding-top: 30px;
  }
}

.copy-btn, .delete-btn {
  height: 32px;
  width: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>