<template>
  <div
    class="group-container"
    :class="containerClass"
  >
    <div class="group-header">
      <div class="group-marker">
        <a-button
          v-if="nestingLevel > 1"
          ghost
          class="expand-collapse-btn"
          @click="toggleCollapsed"
        >
          <span
            :class="{
              'rotate-180': isCollapsed,
            }"
          >
            <a-icon type="caret-up" />
          </span>
        </a-button>
        <span class="bracket">(</span>
      </div>

      <div class="nesting-info">
        <span class="level-badge">Level {{ nestingLevel }}</span>
        <span v-if="isAtDepthLimit || wouldExceedDepthLimit" class="depth-limit-badge">Max Depth</span>
      </div>

      <div class="delete-group-container">
        <a-button
          type="danger" ghost
          size="small"
          class="delete-group-btn"
          @click="$emit('remove-condition')"
        >
          Delete Group
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
            :group.sync="localGroup.conditions[groupIndex]"
            :is-nested="true"
            :nesting-level="nestingLevel + 1"
            @remove-condition="removeGroupCondition(groupIndex)"
          />

          <ConditionInputs
            v-else
            :condition="groupCond"
            :show-remove="localGroup.conditions.length > 2 && groupIndex > 0"
            @remove="removeGroupCondition(groupIndex)"
            class="condition-item"
            @update:condition="updateCondition(groupIndex, $event)"
          />

          <div
            v-if="groupIndex < localGroup.conditions.length - 1"
            class="join-operator"
          >
            <JoinSelect
              :selected.sync="localGroup.joinOperator"
              class="join-select"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="group-footer">
      <div class="group-actions">
        <a-button
          v-if="localGroup.conditions.length < 2"
          type="link" ghost size="small"
          class="add-condition-btn action-btn"
          @click="addGroupCondition"
        >
          Add Condition
        </a-button>

        <!-- Only show if not at depth limit -->
        <a-button
          v-if="localGroup.conditions.length >= 2 && !hasOnlyGroupsInGroup && !wouldExceedDepthLimit && !isAtDepthLimit"
          type="link" ghost
          class="bracket-btn action-btn"
          size="small"
          @click="bracketGroupConditions"
        >
          Bracket These Conditions
        </a-button>

        <!-- Only show if not at depth limit -->
        <a-button
          v-if="localGroup.conditions.length >= 2 && !wouldExceedDepthLimit && !isAtDepthLimit"
          type="link" ghost
          class="add-group-btn action-btn"
          @click="addNestedGroup"
          size="small"
        >
          Add Group
        </a-button>

        <div v-if="(isAtDepthLimit || wouldExceedDepthLimit) && (localGroup.conditions.length >= 2)" class="depth-limit-notice">
          Maximum nesting depth reached
        </div>

      </div>

      <span class="bracket">)</span>
    </div>
  </div>
</template>

<script>
import RuleService from "./RuleService.js";

export default {
  name: 'ConditionGroup',
  components: {
    JoinSelect: () => import("./JoinSelect.vue"),
    ConditionInputs: () => import("./ConditionInputs.vue"),
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
      localGroup: JSON.parse(JSON.stringify(this.group))
    };
  },
  computed: {
    containerClass() {
      return {
        [`level-${this.nestingLevel}`]: true,
        'depth-limit-reached': this.isAtDepthLimit || this.wouldExceedDepthLimit
      };
    },
    hasOnlyGroupsInGroup() {
      // Check if all conditions within a group are themselves groups
      return this.localGroup.conditions.length > 0 && this.localGroup.conditions.every(cond => cond.isGroup);
    },
    groupSummary() {
      // Create a summary of the group's conditions
      const conditionCount = this.countTotalConditions(this.localGroup);
      return `Contains ${conditionCount} condition${conditionCount !== 1 ? 's' : ''}`;
    },
    isAtDepthLimit() {
      return this.nestingLevel >= RuleService.DEPTH_LIMIT;
    },
    // Calculate the maximum depth of any branch within this group
    groupMaxDepth() {
      return RuleService.calculateDepth(this.localGroup.conditions);
    },
    // Check if adding another level of nesting would exceed the depth limit
    wouldExceedDepthLimit() {
      // We need to add 1 to account for the current nesting level
      return (this.nestingLevel + this.groupMaxDepth + 1) > RuleService.DEPTH_LIMIT;
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
      handler(newValue) {
        // Only update local data if it's different from external prop
        if (JSON.stringify(newValue) !== JSON.stringify(this.localGroup)) {
          this.localGroup = JSON.parse(JSON.stringify(newValue));
        }
      },
      deep: true
    },
    localGroup: {
      handler(newValue) {
        this.$emit('update:group', newValue);
      },
      deep: true
    }
  },
  methods: {
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed;
    },

    updateCondition(index, newCondition) {
      const updatedConditions = [...this.localGroup.conditions];
      updatedConditions[index] = newCondition;
      this.localGroup = {
        ...this.localGroup,
        conditions: updatedConditions
      };
    },

    updateJoinOperator(newOperator) {
      this.localGroup = {
        ...this.localGroup,
        joinOperator: newOperator
      };
    },

    countTotalConditions(group) {
      let count = 0;

      for (const condition of group.conditions) {
        if (condition.isGroup) {
          count += this.countTotalConditions(condition);
        } else {
          count++;
        }
      }

      return count;
    },

    addGroupCondition() {
      // Only add a condition if there are fewer than 2 conditions in the group
      if (this.localGroup.conditions.length < 2) {
        // Add a new condition to the group
        const newConditions = [...this.localGroup.conditions, RuleService.newCondition()];
        this.localGroup = {
          ...this.localGroup,
          conditions: newConditions
        };
      }
    },

    bracketGroupConditions() {
      // Check if adding a nested group would exceed depth limit
      if (this.wouldExceedDepthLimit || this.isAtDepthLimit) {
        alert(`Cannot add more brackets - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Create a nested group from the existing conditions in this group
      const nestedGroup = {
        id: RuleService.generateId(),
        isGroup: true,
        joinOperator: this.localGroup.joinOperator || '&&',
        conditions: JSON.parse(JSON.stringify(this.localGroup.conditions))
      };

      // Update the local group with the nested group and a new condition
      this.localGroup = {
        ...this.localGroup,
        conditions: [nestedGroup, RuleService.newCondition()],
        joinOperator: '&&'
      };
    },

    addNestedGroup() {
      // Check if adding a nested group would exceed depth limit
      if (this.wouldExceedDepthLimit || this.isAtDepthLimit) {
        alert(`Cannot add nested group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      let newConditions;

      if (this.localGroup.conditions.length >= 1) {
        // If we already have conditions in the parent group, create a nested group
        // with the last condition and a new one
        const lastCondition = this.localGroup.conditions[this.localGroup.conditions.length - 1];

        // Create a new nested group with the last condition and a new empty one
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            RuleService.newCondition()
          ]
        };

        // Create new conditions array without the last condition and with the new group
        newConditions = [...this.localGroup.conditions.slice(0, -1), newGroup];
      } else {
        // Just add a new nested group with two empty conditions
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            RuleService.newCondition(),
            RuleService.newCondition()
          ]
        };
        newConditions = [...this.localGroup.conditions, newGroup];
      }

      // Update the local group
      this.localGroup = {
        ...this.localGroup,
        conditions: newConditions
      };
    },

    removeGroupCondition(index) {
      // Create a new array without the condition at the specified index
      const newConditions = [...this.localGroup.conditions];
      newConditions.splice(index, 1);

      // If we removed the last condition, add a new one
      if (newConditions.length === 0) {
        newConditions.push(RuleService.newCondition());
      }

      // Update the local group
      this.localGroup = {
        ...this.localGroup,
        conditions: newConditions
      };
    }
  }
}
</script>