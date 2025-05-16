<template>
  <div class="create-pattern-builder">
    <div
      v-for="(condition, index) in conditions"
      :key="condition.id"
      class="condition-container"
    >
      <!-- Group container for brackets -->
      <condition-group
        v-if="condition.isGroup"
        :group-path="['create_pattern', 'conditions', index]"
        @remove="removeCondition(index)"
      />

      <!-- Regular condition -->
      <condition-inputs
        v-else
        :condition-path="['create_pattern', 'conditions', index]"
        :show-remove="conditions.length > 1"
        @remove="removeCondition(index)"
        class="condition-row"
        :show-labels="conditions.length <= 1"
        @copy="handleCopyCondition"
      />

      <div v-if="index < conditions.length - 1" class="join-operator-row">
        <select-dropdown
          :selected="getJoinOperator(index)"
          :options="joinOperatorOptions"
          :placeholder="$t('ruleBuilder.selectJoin')"
          @update:selected="(value) => updateJoinOperator(index, value)"
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
import { mapState, mapGetters, mapActions } from 'vuex';
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionInputs from "./ConditionInputs.vue";
import ConditionService, { JOIN_OPERATOR, RULE_FIELDS, CONDITION_OPERATOR } from "./ConditionService";
import RuleService from "./RuleService";

export default {
  name: 'CreatePatternBuilder',
  components: {
    ConditionGroup: () => import('./ConditionGroup.vue'),
    ConditionInputs,
    SelectDropdown
  },
  data() {
    return {
      joinOperatorOptions: ConditionService.joinOperators,
      maxDepthLimit: RuleService.DEPTH_LIMIT
    };
  },
  computed: {
    ...mapState('ruleBuilder', {
      storeRule: 'rule' // Alias to avoid name collision
    }),
    ...mapGetters('ruleBuilder', ['getNestedValue']),

    conditions() {
      return this.storeRule?.create_pattern?.conditions || [];
    },

    canAddBrackets() {
      return this.conditions.length >= 2 &&
        !this.hasOnlyGroups() &&
        !this.wouldExceedDepthLimit();
    },

    canAddGroup() {
      return this.conditions.length >= 2 &&
        !this.wouldExceedDepthLimit();
    },

    depthLimitReached() {
      return this.wouldExceedDepthLimit() && this.conditions.length >= 2;
    }
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'updateNestedValue',
      'validateRule'
    ]),

    getJoinOperator(index) {
      return this.conditions[index]?.joinOperator || JOIN_OPERATOR.AND;
    },

    updateJoinOperator(index, value) {
      this.updateNestedValue({
        path: ['create_pattern', 'conditions', index, 'joinOperator'],
        value
      });

      // If we have more than 2 conditions, update all join operators to match
      if (this.conditions.length > 2) {
        for (let i = 0; i < this.conditions.length; i++) {
          if (i !== index && this.conditions[i]) {
            this.updateNestedValue({
              path: ['create_pattern', 'conditions', i, 'joinOperator'],
              value
            });
          }
        }
      }

      // Validate after update
      this.validateRule();
    },

    createNewCondition() {
      return {
        id: RuleService.generateId(),
        field: RULE_FIELDS.URI_PATH,
        operator: CONDITION_OPERATOR.EQUALS,
        value: '',
        isGroup: false,
        joinOperator: JOIN_OPERATOR.AND
      };
    },

    hasOnlyGroups() {
      return this.conditions.length > 0 &&
        this.conditions.every(c => c.isGroup);
    },

    wouldExceedDepthLimit() {
      const currentDepth = RuleService.calculateDepth(this.conditions);
      return currentDepth + 1 > this.maxDepthLimit;
    },

    addCondition() {
      const newCondition = this.createNewCondition();
      const newConditions = [...this.conditions, newCondition];

      this.updateNestedValue({
        path: ['create_pattern', 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    removeCondition(index) {
      const newConditions = [...this.conditions];
      newConditions.splice(index, 1);

      // Ensure at least one condition exists
      if (newConditions.length === 0) {
        newConditions.push(this.createNewCondition());
      }

      this.updateNestedValue({
        path: ['create_pattern', 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    addGroup() {
      if (this.wouldExceedDepthLimit()) {
        this.$message.warning(`Cannot add group - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      let newConditions;

      if (this.conditions.length >= 1) {
        // If we already have conditions, create a group with the last condition and a new one
        const lastCondition = this.conditions[this.conditions.length - 1];

        // Create a new group
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: JOIN_OPERATOR.AND,
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            this.createNewCondition()
          ]
        };

        // Replace the last condition with the group
        newConditions = [...this.conditions.slice(0, -1), newGroup];
      } else {
        // Just add a new group with two empty conditions
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: JOIN_OPERATOR.AND,
          conditions: [
            this.createNewCondition(),
            this.createNewCondition()
          ]
        };
        newConditions = [newGroup];
      }

      this.updateNestedValue({
        path: ['create_pattern', 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    bracketExistingConditions() {
      if (this.wouldExceedDepthLimit()) {
        this.$message.warning(`Cannot bracket conditions - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      // Create a group from all existing conditions
      const groupedConditions = {
        id: RuleService.generateId(),
        isGroup: true,
        joinOperator: this.getJoinOperator(0),
        conditions: JSON.parse(JSON.stringify(this.conditions))
      };

      // Replace with group and add a new condition
      const newConditions = [
        groupedConditions,
        this.createNewCondition()
      ];

      this.updateNestedValue({
        path: ['create_pattern', 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    handleCopyCondition({ parentPath, currentIndex, newCondition }) {
      // Get current conditions array
      const conditions = [...this.getNestedValue(parentPath)];

      // Insert new condition after the current one
      conditions.splice(currentIndex + 1, 0, newCondition);

      // Update the conditions array
      this.updateNestedValue({
        path: parentPath,
        value: conditions
      });
    }
  }
};
</script>