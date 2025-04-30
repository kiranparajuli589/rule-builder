<template>
  <div
    class="group-container"
    :class="containerClass"
  >
    <div class="group-header">
      <div class="group-marker">
        <button
          type="button"
          class="expand-collapse-btn"
          @click="toggleCollapsed"
        >
          <span v-if="isCollapsed">▶</span>
          <span v-else>▼</span>
        </button>
        <span class="bracket">(</span>
      </div>

      <div class="nesting-info">
        Group <span class="level-badge">Level {{ nestingLevel }}</span>
        <span v-if="isAtDepthLimit || wouldExceedDepthLimit" class="depth-limit-badge">Max Depth</span>
      </div>

      <div class="delete-group-container">
        <button
          type="button"
          class="delete-group-btn"
          @click="$emit('remove-condition')"
        >
          Delete Group
        </button>
      </div>
    </div>

    <div v-if="isCollapsed" class="collapsed-summary">
      {{ groupSummary }}
    </div>

    <div v-else class="group-content">
      <div class="group-conditions">
        <div v-for="(groupCond, groupIndex) in group.conditions" :key="groupCond.id" class="group-condition">
          <!-- Recursive rendering for nested groups -->
          <condition-group
            v-if="groupCond.isGroup"
            :group="groupCond"
            :is-nested="true"
            :nesting-level="nestingLevel + 1"
            @remove-condition="removeGroupCondition(groupIndex)"
          />

          <ConditionInputs
            v-else
            :condition.sync="groupCond"
            :show-remove="group.conditions.length > 2 && groupIndex > 0"
            @remove="removeGroupCondition(groupIndex)"
            class="condition-item"
          />

          <!-- Join operator between conditions -->
          <div v-if="groupIndex < group.conditions.length - 1" class="join-operator">
            <JoinSelect
              v-model="group.joinOperator"
              class="join-select"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="group-footer">
      <!-- Action buttons -->
      <div class="group-actions">

        <button
          v-if="group.conditions.length < 2"
          type="button"
          class="add-btn"
          @click="addGroupCondition"
        >
          Add Condition
        </button>

        <!-- Only show if not at depth limit -->
        <button
          v-if="group.conditions.length >= 2 && !hasOnlyGroupsInGroup && !wouldExceedDepthLimit && !isAtDepthLimit"
          type="button"
          class="bracket-btn"
          @click="bracketGroupConditions"
        >
          Bracket These Conditions
        </button>

        <!-- Only show if not at depth limit -->
        <button
          v-if="group.conditions.length >= 2 && !wouldExceedDepthLimit && !isAtDepthLimit"
          type="button"
          class="add-group-btn"
          @click="addNestedGroup"
        >
          Add Group
        </button>

        <div v-if="(isAtDepthLimit || wouldExceedDepthLimit) && (group.conditions.length >= 2)" class="depth-limit-notice">
          Maximum nesting depth reached
        </div>

      </div>


      <span class="bracket">)</span>
    </div>
  </div>
</template>

<script>
import ConditionInputs from "@//components/builder-v2/ConditionInputs.vue";
import RuleService from "@//services/RuleService.js";
import JoinSelect from "@//components/builder-v2/JoinSelect.vue";

export default {
  name: 'ConditionGroup',
  components: { JoinSelect, ConditionInputs },
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
      return this.group.conditions.length > 0 && this.group.conditions.every(cond => cond.isGroup);
    },
    groupSummary() {
      // Create a summary of the group's conditions
      const conditionCount = this.countTotalConditions(this.group);
      return `Contains ${conditionCount} condition${conditionCount !== 1 ? 's' : ''}`;
    },
    isAtDepthLimit() {
      return this.nestingLevel >= RuleService.DEPTH_LIMIT;
    },
    // Calculate the maximum depth of any branch within this group
    groupMaxDepth() {
      return RuleService.calculateDepth(this.group.conditions);
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
    }
  },
  methods: {
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed;
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
      if (this.group.conditions.length < 2) {
        // Add a new condition to the group
        this.group.conditions.push(RuleService.newCondition());
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
        joinOperator: this.group.joinOperator || '&&',
        conditions: JSON.parse(JSON.stringify(this.group.conditions))
      };

      // Clear the parent group's conditions and add the nested group
      this.group.conditions = [nestedGroup];

      // Add a new condition to the parent group
      this.group.conditions.push(RuleService.newCondition());

      // Set the join operator for the parent group
      this.group.joinOperator = '&&';
    },

    addNestedGroup() {
      // Check if adding a nested group would exceed depth limit
      if (this.wouldExceedDepthLimit || this.isAtDepthLimit) {
        alert(`Cannot add nested group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      if (this.group.conditions.length >= 1) {
        // If we already have conditions in the parent group, create a nested group
        // with the last condition and a new one
        const lastCondition = this.group.conditions[this.group.conditions.length - 1];

        // Remove the last condition from the parent group
        this.group.conditions.pop();

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

        // Add the new group to the parent group
        this.group.conditions.push(newGroup);
      } else {
        // Just add a new nested group with two empty conditions
        this.group.conditions.push({
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            RuleService.newCondition(),
            RuleService.newCondition()
          ]
        });
      }
    },

    removeGroupCondition(index) {
      this.group.conditions.splice(index, 1);

      // If we removed the last condition, add a new one
      if (this.group.conditions.length === 0) {
        this.addGroupCondition();
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// Add styles for depth limit indicators
.depth-limit-badge {
  background-color: #fed7d7;
  color: #e53e3e;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  border: 1px solid #feb2b2;
}

.depth-limit-notice {
  color: #e53e3e;
  font-size: 12px;
  font-style: italic;
}

.depth-limit-reached {
  &.group-container {
    border-left-color: #e53e3e !important;
    background-color: rgba(254, 215, 215, 0.1);
  }
}

// Style for disabled buttons
.disabled {
  opacity: 0.5;
  cursor: not-allowed !important;

  &:hover {
    background-color: inherit !important;
    transform: none !important;
    box-shadow: none !important;
  }
}
</style>