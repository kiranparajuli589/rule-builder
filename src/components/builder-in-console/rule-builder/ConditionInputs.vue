<template>
  <div class="condition-inputs">
    <div class="field-operator-value">
      <select-dropdown
        :selected.sync="localCondition.field"
        :options="fields"
        :placeholder="$t('ruleBuilder.selectField')"
        @update:selected="onFieldChange"
        menu-width="fit-content"
        btn-width="245px"
      />

      <select-dropdown
        :selected.sync="localCondition.operator"
        :options="operators"
        :placeholder="$t('ruleBuilder.selectOperator')"
        menu-width="fit-content"
      />

      <div class="flex-grow-1">
        <select-dropdown
          v-if="fieldMeta.type === 'select'"
          :selected.sync="localCondition.value"
          :options="fieldMeta.options || []"
          :placeholder="fieldMeta.placeholder"
        />

        <CInput
          v-else-if="fieldMeta.type === 'number'"
          type="number"
          v-model="localCondition.value"
          :placeholder="fieldMeta.placeholder"
          class="value-input"
          :min="fieldMeta.min"
          :max="fieldMeta.max"
          :step="fieldMeta.step"
          required
          @blur="validateField()"
          :is-valid="!validationError"
          :invalid-feedback="validationError"
        />

        <CInput
          v-else
          v-model="localCondition.value"
          :placeholder="$t('ruleBuilder.enterValue')"
          class="value-input"
          required
          @blur="validateField()"
          :is-valid="!validationError"
          :invalid-feedback="validationError"
        />
      </div>
    </div>

    <div v-if="showRemove" class="action-button">
      <a-button
        type="danger"
        ghost
        class="delete-btn"
        @click="$emit('remove')"
      >
        <a-icon type="delete" />
      </a-button>
    </div>
  </div>
</template>

<script>
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionService from "./ConditionService";

export default {
  name: 'ConditionInputs',
  components: {
    SelectDropdown
  },
  props: {
    condition: {
      type: Object,
      required: true
    },
    showRemove: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      localCondition: null,
      validationError: null
    };
  },
  computed: {
    fields() {
      return ConditionService.fields;
    },
    operators() {
      return ConditionService.operators;
    },
    field() {
      return this.fields.find(f => f.value === this.localCondition.field);
    },
    fieldMeta() {
      return this.field ? (this.field?.meta ?? {}) : {};
    }
  },
  watch: {
    condition: {
      immediate: true,
      handler(newVal) {
        // Avoid infinite loops by only updating if different
        if (!this.localCondition || JSON.stringify(newVal) !== JSON.stringify(this.localCondition)) {
          this.localCondition = JSON.parse(JSON.stringify(newVal));
        }
      }
    },

    localCondition: {
      deep: true,
      handler(newVal) {
        // Emit update on a delay to avoid recursive update loops
        this.emitUpdateAfterDelay();
      }
    }
  },
  created() {
    this.localCondition = JSON.parse(JSON.stringify(this.condition));
  },
  methods: {
    onFieldChange() {
      // Reset value when field changes
      this.localCondition.value = '';
      this.validationError = null;
      this.emitUpdateAfterDelay();
    },

    validateField() {
      this.validationError = null;

      // Check if field has a validate function in ConditionService
      if (this.field && this.field.validate) {
        this.validationError = this.field.validate(this.localCondition.value);
      }
      // Basic validation - required field
      else if (!this.localCondition.value && this.localCondition.value !== 0) {
        this.validationError = 'This field is required';
      }

      return !this.validationError;
    },

    emitUpdateAfterDelay() {
      // Use setTimeout to break potential recursive update cycles
      setTimeout(() => {
        this.$emit('update:condition', JSON.parse(JSON.stringify(this.localCondition)));
      }, 0);
    }
  }
};
</script>