<template>
  <div class="">
    <div class="field-operator-value">
      <SelectDropdown
        class="field-select"
        :selected.sync="localCondition.field"
        :options="RuleService.fields"
        :placeholder="$t('selectField')"
        menu-width="fit-content"
        :label="showLabels ? $t('field') : ''"
        @update:selected="onFieldChange()"
      />
      <SelectDropdown
        class="operator-select"
        :selected.sync="localCondition.operator"
        :options="RuleService.operators"
        :placeholder="$t('selectOperator')"
        menu-width="fit-content"
        :label="showLabels ? $t('operator') : ''"
      />

      <template v-if="$chainer('activeField?.meta?.type') === 'select'">
        <SelectDropdown
          class="value-select flex-grow-1"
          :selected.sync="localCondition.value"
          :options="activeField.meta.options"
          :placeholder="$t('selectValue')"
          :label="showLabels ? $t('value') : ''"
        />
      </template>
      <template v-else-if="$chainer('activeField?.meta?.type') === 'number'">
        <CInput
          type="number"
          v-model="localCondition.value"
          :placeholder="$t('Values')"
          class="value-input"
          :min="activeField.meta.min"
          :max="activeField.meta.max"
          :step="activeField.meta.step"
          required
          :label="showLabels ? $t('value') : ''"
          name="value"
          @blur="validateField()"
          :description="validationError"
          :is-valid="!validationError"
        />
      </template>
      <template v-else>
        <CInput
          type="text"
          v-model="localCondition.value"
          :placeholder="$t('Values')"
          class="value-input"
          required
          :label="showLabels ? $t('value') : ''"
        />
      </template>
    </div>

    <a-button
      v-if="showRemove"
      type="danger"
      class="delete-btn"
      @click="removeCondition()"
      icon="close"
    />
  </div>
</template>
<script>
import { OptionalChainerMixin } from "@/mixins/OptionalChainerMixin";

import RuleService from "./RuleService.js";
import ConditionService from "./ConditionService";

export default {
  components: { 
    SelectDropdown: () => import("@/components/SelectDropdown.vue")
  },
  props: {
    showRemove: {
      type: Boolean,
      required: true,
    },
    condition: {
      type: Object,
      required: true,
    },
    showLabels: {
      type: Boolean,
      default: false,
    }
  },
  mixins: [OptionalChainerMixin],
  data() {
    return {
      validationError: null,
      localCondition: JSON.parse(JSON.stringify(this.condition))
    };
  },
  computed: {
    RuleService() {
      return RuleService
    },
    ConditionService() {
      return ConditionService
    },
    activeField() {
      const options = this.RuleService.fields;
      const selected = options.find(o => o.value === this.localCondition.field);
      console.log("selected", selected);
      return selected;
    }
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
    validateField() {
      this.validationError = this.ConditionService.getFieldValidationError(
        this.localCondition.field,
        this.localCondition.value
      );

      return !this.validationError;
    },
    onFieldChange() {
      this.localCondition.value = null;
      this.validationError = null;
    }
  },
}
</script>