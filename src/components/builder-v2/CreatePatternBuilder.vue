<template>
  <div class="create-pattern-builder">
    <div
      v-for="(condition, index) in localConditions"
      :key="condition.id"
      class="condition-container"

    >
      <!-- Group container for brackets - use recursive component -->
      <condition-group
        v-if="condition.isGroup"
        :group="condition"
        @remove-condition="removeCondition(index)"
      />

      <ConditionInputs
        v-else
        :condition.sync="condition"
        :show-remove="localConditions.length > 1"
        @remove="removeCondition(index)"
        class="condition-row"
      />

      <!-- Join operator between top-level conditions -->
      <div v-if="index < localConditions.length - 1" class="join-operator-row">
        <JoinSelect v-model="joinOperators[index]" @operator-changed="updateJoinOperator(index, $event)" />
      </div>
    </div>

    <div class="actions-row">
      <button
        v-if="localConditions.length < 2"
        type="button"
        class="add-btn"
        @click="addCondition"
      >
        + Add Condition
      </button>

      <button
        v-if="localConditions.length >= 2 && !hasOnlyGroups() && !wouldExceedDepthLimit"
        type="button"
        class="bracket-btn"
        @click="bracketExistingConditions"
      >
        Bracket These Conditions
      </button>

      <button
        v-if="localConditions.length >= 2 && !wouldExceedDepthLimit"
        type="button"
        class="add-group-btn"
        @click="addGroup"
      >
        Add Group
      </button>

      <div v-if="wouldExceedDepthLimit && localConditions.length >= 2" class="depth-limit-notice">
        Maximum nesting depth of {{ RuleService.DEPTH_LIMIT }} reached
      </div>
    </div>

    <div v-if="isRuleTooComplex" class="rule-too-complex">
      <div class="alert alert-warning">
        <strong>Warning:</strong> This rule has become too complex with a depth of
        {{ currentDepth }} levels (maximum is {{ RuleService.DEPTH_LIMIT }}).
        <button type="button" class="btn-reset-rule" @click="resetRule">
          Reset Rule
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ConditionGroup from './ConditionGroup.vue';
import RuleService from "@//services/RuleService.js";
import { RuleMixin } from "@//mixins/RuleMixin.js";
import ConditionInputs from "@//components/builder-v2/ConditionInputs.vue";
import JoinSelect from "@//components/builder-v2/JoinSelect.vue";

export default {
  name: 'CreatePatternBuilder',
  components: {
    JoinSelect,
    ConditionInputs,
    ConditionGroup
  },
  mixins: [RuleMixin],
  props: {
    conditions: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      hasPromptedForBracketing: false,
      lastCheckedDepth: 0,
    };
  },
  computed: {
    RuleService() {
      return RuleService;
    },
    wouldExceedDepthLimit() {
      // Check if adding a group at top level would exceed the depth limit
      return RuleService.wouldExceedDepthLimit(this.localConditions);
    },
    currentDepth() {
      return RuleService.calculateDepth(this.localConditions);
    },
    isRuleTooComplex() {
      // Consider showing a warning if depth is getting close to or exceeding the limit
      return this.currentDepth > RuleService.DEPTH_LIMIT;
    }
  },
  watch: {
    conditions: {
      handler(newValue) {
        if (JSON.stringify(newValue) !== JSON.stringify(this.localConditions)) {
          this.initializeFromProps();
        }
      },
      deep: true,
      immediate: true
    },
    currentDepth: {
      handler(newDepth, oldDepth) {
        // Check if depth has increased beyond the limit
        if (newDepth > RuleService.DEPTH_LIMIT && newDepth > this.lastCheckedDepth) {
          this.lastCheckedDepth = newDepth;
          this.enforceDepthLimitNow();
        }
      }
    }
  },
  methods: {
    // Override addGroup method to check depth limit
    addGroup() {
      // Check if adding a group would exceed depth limit
      if (this.wouldExceedDepthLimit) {
        alert(`Cannot add group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Use the addGroup method from the mixin
      this.$options.mixins[0].methods.addGroup.call(this);
    },

    // Override bracketExistingConditions to check depth limit
    bracketExistingConditions() {
      // Check if adding a group would exceed depth limit
      if (this.wouldExceedDepthLimit) {
        alert(`Cannot bracket conditions - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Use the bracketExistingConditions method from the mixin
      this.$options.mixins[0].methods.bracketExistingConditions.call(this);
    },

    // Method to enforce depth limit immediately
    enforceDepthLimitNow() {
      console.warn(`Rule depth (${this.currentDepth}) exceeds limit (${RuleService.DEPTH_LIMIT}). Enforcing depth limit...`);

      // Create a deep copy to avoid reference issues
      let simplifiedConditions = JSON.parse(JSON.stringify(this.localConditions));

      // Apply auto-simplification - limit to 5 attempts to prevent freezing
      for (let attempt = 0; attempt < 5; attempt++) {
        const deepestInfo = RuleService.findDeepestGroup(simplifiedConditions);

        if (!deepestInfo.path || deepestInfo.path.length === 0 || deepestInfo.depth <= RuleService.DEPTH_LIMIT) {
          break;
        }

        RuleService.simplifyDeepestGroup(simplifiedConditions, deepestInfo.path);
      }

      // Check if simplified conditions are within limit
      const newDepth = RuleService.calculateDepth(simplifiedConditions);

      if (newDepth <= RuleService.DEPTH_LIMIT) {
        // Update conditions with simplified version
        this.localConditions = simplifiedConditions;
        alert(`Your rule exceeded the maximum nesting depth of ${RuleService.DEPTH_LIMIT}. It has been automatically simplified.`);
      } else {
        // If still too complex, show warning but don't freeze UI
        console.error(`Unable to simplify rule to meet depth limit of ${RuleService.DEPTH_LIMIT}. Current depth: ${newDepth}`);
      }
    },

    // Reset the rule to a simple state if it becomes too complex
    resetRule() {
      if (confirm("This will reset your current rule to a blank state. Are you sure?")) {
        this.localConditions = [RuleService.newCondition()];
        this.joinOperators = [];
        this.lastCheckedDepth = 0;
        this.$emit('update:conditions', this.localConditions);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.depth-limit-notice {
  color: #e53e3e;
  font-size: 13px;
  font-style: italic;
  margin-left: 10px;
}

.disabled {
  opacity: 0.5;
  cursor: not-allowed !important;

  &:hover {
    background-color: inherit !important;
    transform: none !important;
    box-shadow: none !important;
  }
}

.rule-too-complex {
  margin-top: 15px;
}

.alert {
  padding: 12px 16px;
  border-radius: 6px;
  margin: 10px 0;

  &.alert-warning {
    background-color: #fef5e7;
    border: 1px solid #f8bb86;
    color: #8a5d3b;
  }
}

.btn-reset-rule {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-left: 10px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background-color: #c53030;
  }
}
</style>