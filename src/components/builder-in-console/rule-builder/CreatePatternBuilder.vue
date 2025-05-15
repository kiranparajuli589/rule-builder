<!-- src/components/rule-builder/CreatePatternBuilder.vue -->
<template>
  <div class="create-pattern-builder">
    <div
      v-for="(condition, index) in localConditions"
      :key="condition.id"
      class="condition-container"
    >
      <!-- Group container for brackets -->
      <condition-group
        v-if="condition.isGroup"
        :group="condition"
        :nesting-level="1"
        @remove-condition="removeCondition(index)"
        @update:group="updateGroup(index, $event)"
      />

      <!-- Regular condition -->
      <condition-inputs
        v-else
        :condition="condition"
        :show-remove="localConditions.length > 1"
        @remove="removeCondition(index)"
        @update:condition="updateCondition(index, $event)"
        class="condition-row"
      />

      <div v-if="index < localConditions.length - 1" class="join-operator-row">
        <select-dropdown
          :selected.sync="joinOperators[index]"
          :options="joinOperatorOptions"
          :placeholder="$t('ruleBuilder.selectJoin')"
          @update:selected="onJoinOperatorChange(index, $event)"
        />
      </div>
    </div>

    <div class="actions-row">
      <a-button
        type="primary"
        ghost
        @click="addCondition"
        class="action-btn add-condition-btn outer"
      >
        <a-icon type="plus" />
        {{$t('ruleBuilder.addCondition')}}
      </a-button>
      <a-button
        v-if="canAddBrackets"
        type="primary"
        ghost
        class="action-btn bracket-btn outer"
        @click="bracketExistingConditions"
      >
        <a-icon type="border-outer" />
        {{$t('ruleBuilder.bracketConditions')}}
      </a-button>

      <a-button
        v-if="canAddGroup"
        type="primary"
        ghost
        class="action-btn add-group-btn outer"
        @click="addGroup"
      >
        <a-icon type="appstore" />
        {{$t('ruleBuilder.AddGroup')}}
      </a-button>

      <div v-if="depthLimitReached" class="depth-limit-notice">
        {{$t('ruleBuilder.DepthLimitWarning', [maxDepthLimit])}}
      </div>
    </div>
  </div>
</template>

<script>
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionInputs from "./ConditionInputs.vue";
import ConditionService from "./ConditionService";

export default {
  name: 'CreatePatternBuilder',
  components: {
    ConditionGroup: () => import('./ConditionGroup.vue'),
    ConditionInputs,
    SelectDropdown
  },
  props: {
    conditions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      localConditions: [],
      joinOperators: [],
      isProcessingAutomatic: false,
      joinOperatorOptions: ConditionService.joinOperators,
      maxDepthLimit: 3
    };
  },
  computed: {
    canAddBrackets() {
      return this.localConditions.length >= 2 &&
        !this.hasOnlyGroups() &&
        !this.wouldExceedDepthLimit();
    },
    canAddGroup() {
      return this.localConditions.length >= 2 &&
        !this.wouldExceedDepthLimit();
    },
    depthLimitReached() {
      return this.wouldExceedDepthLimit() && this.localConditions.length >= 2;
    }
  },
  watch: {
    conditions: {
      immediate: true,
      handler(newVal) {
        // Only initialize if different - prevent infinite loops
        const newValStr = JSON.stringify(newVal);
        const localStr = JSON.stringify(this.localConditions);

        if (newValStr !== localStr) {
          this.initializeFromProps(newVal);
        }
      }
    }
  },
  created() {
    this.initializeFromProps(this.conditions);
  },
  methods: {
    initializeFromProps(conditions) {
      // Deep copy to avoid reference issues
      this.localConditions = conditions && conditions.length ?
        JSON.parse(JSON.stringify(conditions)) :
        [this.createNewCondition()];

      // Initialize join operators
      this.joinOperators = [];
      for (let i = 0; i < this.localConditions.length - 1; i++) {
        this.joinOperators.push('&&'); // Default to AND
      }
    },

    createNewCondition() {
      return {
        id: '_' + Math.random().toString(36).substr(2, 9),
        field: 'req.uri.path',
        operator: '==',
        value: '',
        isGroup: false
      };
    },

    updateCondition(index, updatedCondition) {
      if (index >= 0 && index < this.localConditions.length) {
        this.localConditions.splice(index, 1, updatedCondition);
        this.emitUpdateAfterDelay();
      }
    },

    updateGroup(index, updatedGroup) {
      if (index >= 0 && index < this.localConditions.length) {
        this.localConditions.splice(index, 1, updatedGroup);
        this.emitUpdateAfterDelay();
      }
    },

    onJoinOperatorChange(index, value) {
      if (index >= 0 && index < this.joinOperators.length) {
        // First set the specific join operator that was changed
        this.joinOperators[index] = value;

        // If we have more than 2 conditions, update all join operators to match
        if (this.localConditions.length > 2) {
          // Update all join operators to use the same value
          for (let i = 0; i < this.joinOperators.length; i++) {
            this.joinOperators[i] = value;
          }
        }

        this.emitUpdateAfterDelay();
      }
    },

    hasOnlyGroups() {
      return this.localConditions.length > 0 &&
        this.localConditions.every(c => c.isGroup);
    },

    wouldExceedDepthLimit() {
      // Implement a simpler version to prevent loops
      const currentDepth = this.calculateDepth(this.localConditions);
      return currentDepth + 1 > this.maxDepthLimit;
    },

    calculateDepth(conditions) {
      if (!conditions || conditions.length === 0) return 0;

      let maxDepth = 0;
      for (const condition of conditions) {
        if (condition.isGroup && condition.conditions) {
          const groupDepth = 1 + this.calculateDepth(condition.conditions);
          maxDepth = Math.max(maxDepth, groupDepth);
        }
      }

      return maxDepth;
    },

    addCondition() {
      // Add a new condition at the top level
      this.localConditions.push(this.createNewCondition());

      // If we now have 2+ conditions, add a join operator
      if (this.localConditions.length > 1) {
        this.joinOperators.push('&&');
      }

      this.emitUpdateAfterDelay();
    },

    removeCondition(index) {
      if (index >= 0 && index < this.localConditions.length) {
        this.localConditions.splice(index, 1);

        // Update join operators array
        if (index < this.joinOperators.length) {
          this.joinOperators.splice(index, 1);
        } else if (this.joinOperators.length > 0) {
          this.joinOperators.pop();
        }

        // Ensure at least one condition exists
        if (this.localConditions.length === 0) {
          this.localConditions.push(this.createNewCondition());
        }

        this.emitUpdateAfterDelay();
      }
    },

    addGroup() {
      if (this.wouldExceedDepthLimit()) {
        alert(`Cannot add group - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      if (this.localConditions.length >= 1) {
        // If we already have conditions, create a group with the last condition and a new one
        const lastCondition = this.localConditions[this.localConditions.length - 1];

        // Remove the last condition
        this.localConditions.pop();

        // Also remove the last join operator if there is one
        if (this.joinOperators.length > 0) {
          this.joinOperators.pop();
        }

        // Create a new group
        const newGroup = {
          id: '_' + Math.random().toString(36).substr(2, 9),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            this.createNewCondition()
          ]
        };

        // Add the new group
        this.localConditions.push(newGroup);
      } else {
        // Just add a new group with two empty conditions
        this.localConditions.push({
          id: '_' + Math.random().toString(36).substr(2, 9),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            this.createNewCondition(),
            this.createNewCondition()
          ]
        });
      }

      // Add a join operator if needed
      if (this.localConditions.length > 1) {
        this.joinOperators.push('&&');
      }

      this.emitUpdateAfterDelay();
    },

    bracketExistingConditions() {
      if (this.wouldExceedDepthLimit()) {
        alert(`Cannot bracket conditions - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      // Create a group from all existing conditions
      const groupedConditions = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        isGroup: true,
        joinOperator: this.joinOperators[0] || '&&',
        conditions: JSON.parse(JSON.stringify(this.localConditions))
      };

      // Replace existing conditions with the group
      this.localConditions = [groupedConditions];
      this.joinOperators = [];

      // Automatically add a new empty condition
      this.localConditions.push(this.createNewCondition());

      // Add join operator
      this.joinOperators.push('&&');

      this.emitUpdateAfterDelay();
    },

    groupFirstTwoConditions() {
      if (this.localConditions.length >= 3 && !this.wouldExceedDepthLimit()) {
        // Group first two conditions
        const groupedConditions = {
          id: '_' + Math.random().toString(36).substr(2, 9),
          isGroup: true,
          joinOperator: this.joinOperators[0],
          conditions: [
            JSON.parse(JSON.stringify(this.localConditions[0])),
            JSON.parse(JSON.stringify(this.localConditions[1]))
          ]
        };

        // Create new conditions array with the group and the third condition
        const thirdCondition = this.localConditions[2];
        this.localConditions = [groupedConditions, thirdCondition];

        // Update join operators
        if (this.joinOperators.length > 1) {
          this.joinOperators = [this.joinOperators[1]];
        } else {
          this.joinOperators = ['&&'];
        }

        this.emitUpdateAfterDelay();
      }
    },

    emitUpdateAfterDelay() {
      // Use setTimeout to break potential recursive update cycles
      setTimeout(() => {
        this.$emit('update:conditions', JSON.parse(JSON.stringify(this.localConditions)));
      }, 0);
    }
  }
};
</script>