<template>
  <div
    class="group-container"
    :class="'level-' + nestingLevel"
  >
    <div class="group-header">
      <div class="group-marker">
        <a-tooltip placement="bottom" :mouse-enter-delay="0.5">
          <template #title>
            {{isCollapsed ? $t('ruleBuilder.expandGroup') : $t('ruleBuilder.collapseGroup')}}
          </template>
          <a-button
            v-if="nestingLevel > 1"
            type="link"
            ghost
            class="expand-collapse-btn"
            @click="toggleCollapsed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              :class="{
                'collapsed': isCollapsed,
              }"
            >
              <path fill="currentColor"
                    d="M9.367 2.25h5.266c1.092 0 1.958 0 2.655.057c.714.058 1.317.18 1.869.46a4.75 4.75 0 0 1 2.075 2.077c.281.55.403 1.154.461 1.868c.057.697.057 1.563.057 2.655v5.266c0 1.092 0 1.958-.057 2.655c-.058.714-.18 1.317-.46 1.869a4.75 4.75 0 0 1-2.076 2.075c-.552.281-1.155.403-1.869.461c-.697.057-1.563.057-2.655.057H9.367c-1.092 0-1.958 0-2.655-.057c-.714-.058-1.317-.18-1.868-.46a4.75 4.75 0 0 1-2.076-2.076c-.281-.552-.403-1.155-.461-1.869c-.057-.697-.057-1.563-.057-2.655V9.367c0-1.092 0-1.958.057-2.655c.058-.714.18-1.317.46-1.868a4.75 4.75 0 0 1 2.077-2.076c.55-.281 1.154-.403 1.868-.461c.697-.057 1.563-.057 2.655-.057m-.337 7.97a.75.75 0 1 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 1 0-1.06-1.06L12 13.19z"/>
            </svg>
          </a-button>
        </a-tooltip>
        <span class="bracket">(</span>
      </div>

      <div class="nesting-info">
        {{ $t('ruleBuilder.level') }} {{ nestingLevel }}
        <span v-if="isAtDepthLimit" class="depth-limit-badge">{{$t('ruleBuilder.maxDepth')}}</span>
      </div>

      <div class="delete-group-container">
        <a-button
          type="danger"
          ghost size="small"
          class="delete-group-btn"
          @click="$emit('remove-condition')"
        >
          {{$t('ruleBuilder.DeleteGroup')}}
        </a-button>
      </div>
    </div>

    <div v-if="isCollapsed" class="collapsed-summary">
      {{ groupSummary }}
    </div>

    <div v-else class="group-content">
      <div class="group-conditions">
        <div v-for="(groupCond, groupIndex) in localGroup.conditions" :key="groupCond.id" class="group-condition">
          <!-- Recursive rendering for nested groups -->
          <condition-group
            v-if="groupCond.isGroup"
            :group="groupCond"
            :is-nested="true"
            :nesting-level="nestingLevel + 1"
            @remove-condition="removeGroupCondition(groupIndex)"
            @update:group="updateNestedGroup(groupIndex, $event)"
          />

          <condition-inputs
            v-else
            :condition="groupCond"
            :show-remove="localGroup.conditions.length > 1"
            @remove="removeGroupCondition(groupIndex)"
            @update:condition="updateCondition(groupIndex, $event)"
            class="condition-item"
          />

          <div v-if="groupIndex < localGroup.conditions.length - 1" class="join-operator-row">
            <select-dropdown
              :selected.sync="localJoinOperator"
              :options="joinOperators"
              :placeholder="$t('ruleBuilder.selectOperator')"
              @update:selected="onJoinOperatorChange"
            />
          </div>
        </div>
      </div>

    </div>

    <div class="group-footer">
      <div class="group-actions">
        <a-button
          type="primary"
          ghost size="small"
          @click="addCondition"
          class="action-btn add-condition-btn"
        >
          <a-icon type="plus" />
          Add Condition
        </a-button>
        
        <a-button
          v-if="canAddBrackets"
          type="primary"
          ghost
          class="action-btn bracket-btn"
          @click="bracketGroupConditions"
        >
          <a-icon type="border-outer" />
          {{$t('ruleBuilder.bracketConditions')}}
        </a-button>

        <a-button
          v-if="canAddNestedGroup"
          type="primary"
          ghost
          class="action-btn add-group-btn"
          @click="addNestedGroup"
        >
          <a-icon type="appstore" />
          {{$t('ruleBuilder.AddGroup')}}
        </a-button>
      </div>
      <span class="bracket">)</span>
    </div>
  </div>
</template>

<script>
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionInputs from "./ConditionInputs.vue";
import ConditionService, { CONDITION_OPERATOR, JOIN_OPERATOR, RULE_FIELDS } from "./ConditionService";

export default {
  name: 'ConditionGroup',
  components: {
    SelectDropdown,
    ConditionInputs
  },
  props: {
    group: {
      type: Object,
      required: true
    },
    isNested: {
      type: Boolean,
      default: false
    },
    nestingLevel: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      isCollapsed: false,
      localGroup: null,
      localJoinOperator: JOIN_OPERATOR.AND,
      joinOperators: ConditionService.joinOperators,
      maxDepthLimit: 3
    };
  },
  computed: {
    groupSummary() {
      const conditionCount = this.countTotalConditions();
      return `Contains ${conditionCount} condition${conditionCount !== 1 ? 's' : ''}`;
    },

    isAtDepthLimit() {
      return this.nestingLevel >= this.maxDepthLimit;
    },

    canAddBrackets() {
      return this.localGroup && this.localGroup.conditions &&
        this.localGroup.conditions.length >= 2 &&
        !this.hasOnlyGroupsInGroup() &&
        !this.isAtDepthLimit;
    },

    canAddNestedGroup() {
      return this.localGroup && this.localGroup.conditions &&
        this.localGroup.conditions.length >= 2 &&
        !this.isAtDepthLimit;
    }
  },
  watch: {
    nestingLevel: {
      immediate: true,
      handler(newLevel) {
        // Auto-collapse groups beyond level 2
        this.isCollapsed = newLevel > 2;
      }
    },

    group: {
      immediate: true,
      handler(newValue) {
        if (!this.localGroup || JSON.stringify(newValue) !== JSON.stringify(this.localGroup)) {
          this.localGroup = JSON.parse(JSON.stringify(newValue));
          // Initialize localJoinOperator from group
          if (this.localGroup && this.localGroup.joinOperator) {
            this.localJoinOperator = this.localGroup.joinOperator;
          }
        }
      }
    },

    localGroup: {
      deep: true,
      handler() {
        this.emitUpdateAfterDelay();
      }
    }
  },
  created() {
    this.localGroup = JSON.parse(JSON.stringify(this.group));
    // Initialize localJoinOperator from group
    if (this.localGroup && this.localGroup.joinOperator) {
      this.localJoinOperator = this.localGroup.joinOperator;
    }
  },
  methods: {
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed;
    },

    countTotalConditions() {
      let count = 0;

      if (!this.localGroup || !this.localGroup.conditions) {
        return count;
      }

      for (const condition of this.localGroup.conditions) {
        if (condition.isGroup && condition.conditions) {
          // For groups, count nested conditions recursively
          for (const nestedCondition of condition.conditions) {
            count++;
          }
        } else {
          count++;
        }
      }

      return count;
    },

    updateCondition(index, updatedCondition) {
      if (this.localGroup.conditions[index]) {
        this.localGroup.conditions.splice(index, 1, updatedCondition);
      }
    },

    onJoinOperatorChange(value) {
      this.localJoinOperator = value;
      this.localGroup.joinOperator = value;

      // Always apply the same operator to all join points within this group
      if (this.localGroup.conditions && this.localGroup.conditions.length > 0) {
        // For all group conditions, update their join operators if they are groups
        for (let i = 0; i < this.localGroup.conditions.length; i++) {
          const condition = this.localGroup.conditions[i];
          if (condition.isGroup) {
            condition.joinOperator = value;
          }
        }
      }

      this.emitUpdateAfterDelay();
    },

    updateNestedGroup(index, updatedGroup) {
      if (this.localGroup.conditions[index]) {
        this.localGroup.conditions.splice(index, 1, updatedGroup);
      }
    },

    hasOnlyGroupsInGroup() {
      return this.localGroup.conditions && this.localGroup.conditions.length > 0 &&
        this.localGroup.conditions.every(c => c.isGroup);
    },

    createNewCondition() {
      return {
        id: '_' + Math.random().toString(36).substr(2, 9),
        field: RULE_FIELDS.URI_PATH,
        operator: CONDITION_OPERATOR.EQUALS,
        value: '',
        isGroup: false
      };
    },

    addCondition() {
      if (!this.localGroup.conditions) {
        this.localGroup.conditions = [];
      }

      // Add new condition to the group
      this.localGroup.conditions.push(this.createNewCondition());

      // If we now have more than 2 conditions, ensure the join operator is consistent
      if (this.localGroup.conditions.length > 2) {
        // Make sure all joins use the same operator
        this.localGroup.joinOperator = this.localJoinOperator;
      }
    },

    bracketGroupConditions() {
      if (this.isAtDepthLimit) {
        alert(`Cannot add more brackets - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      // Create a nested group from the existing conditions
      const nestedGroup = {
        id: '_' + Math.random().toString(36).substr(2, 9),
        isGroup: true,
        joinOperator: this.localGroup.joinOperator || JOIN_OPERATOR.AND,
        conditions: JSON.parse(JSON.stringify(this.localGroup.conditions))
      };

      // Clear current conditions and add the nested group with a new condition
      this.localGroup.conditions = [
        nestedGroup,
        this.createNewCondition()
      ];

      // Update join operator
      this.localGroup.joinOperator = JOIN_OPERATOR.AND;
      this.localJoinOperator = JOIN_OPERATOR.AND;
    },

    addNestedGroup() {
      if (this.isAtDepthLimit) {
        alert(`Cannot add nested group - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      let newConditions;

      if (this.localGroup.conditions.length >= 1) {
        // Use the last condition for the new group
        const lastCondition = this.localGroup.conditions[this.localGroup.conditions.length - 1];

        // Create new group with last condition and a new one
        const newGroup = {
          id: '_' + Math.random().toString(36).substr(2, 9),
          isGroup: true,
          joinOperator: JOIN_OPERATOR.AND,
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            this.createNewCondition()
          ]
        };

        // Remove last condition and add the new group
        newConditions = [
          ...this.localGroup.conditions.slice(0, -1),
          newGroup
        ];
      } else {
        // Just add a new group with two empty conditions
        const newGroup = {
          id: '_' + Math.random().toString(36).substr(2, 9),
          isGroup: true,
          joinOperator: JOIN_OPERATOR.AND,
          conditions: [
            this.createNewCondition(),
            this.createNewCondition()
          ]
        };

        newConditions = [...this.localGroup.conditions, newGroup];
      }

      // Update the local group
      this.localGroup.conditions = newConditions;
    },

    removeGroupCondition(index) {
      const newConditions = [...this.localGroup.conditions];
      newConditions.splice(index, 1);

      // If we removed the last condition, add a new one
      if (newConditions.length === 0) {
        newConditions.push(this.createNewCondition());
      }

      // Update the local group
      this.localGroup.conditions = newConditions;
    },

    emitUpdateAfterDelay() {
      // Use setTimeout to break potential recursive update cycles
      setTimeout(() => {
        this.$emit('update:group', JSON.parse(JSON.stringify(this.localGroup)));
      }, 0);
    }
  }
};
</script>