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
          @click="$emit('remove')"
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
        <div v-for="(_, groupIndex) in groupConditions" :key="getConditionId(groupIndex)" class="group-condition">
          <!-- Recursive rendering for nested groups -->
          <condition-group
            v-if="isGroupCondition(groupIndex)"
            :group-path="getNestedPath(groupIndex)"
            :nesting-level="nestingLevel + 1"
            @remove="removeGroupCondition(groupIndex)"
          />

          <condition-inputs
            v-else
            :condition-path="getNestedPath(groupIndex)"
            :show-remove="groupConditions.length > 1"
            @remove="removeGroupCondition(groupIndex)"
            class="condition-item"
            @copy="handleCopyCondition"
            
          />

          <div v-if="groupIndex < groupConditions.length - 1" class="join-operator-row">
            <select-dropdown
              :selected="getJoinOperator(groupIndex)"
              :options="joinOperators"
              :placeholder="$t('ruleBuilder.selectOperator')"
              @update:selected="(value) => updateJoinOperator(groupIndex, value)"
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
import { mapGetters, mapActions } from 'vuex';
import SelectDropdown from "@/components/SelectDropdown.vue";
import ConditionInputs from "./ConditionInputs.vue";
import ConditionService, { JOIN_OPERATOR, RULE_FIELDS, CONDITION_OPERATOR } from "./ConditionService";
import RuleService from "./RuleService";

export default {
  name: 'ConditionGroup',
  components: {
    SelectDropdown,
    ConditionInputs
  },
  props: {
    groupPath: {
      type: Array,
      required: true
    },
    nestingLevel: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      isCollapsed: false,
      joinOperators: ConditionService.joinOperators,
      maxDepthLimit: RuleService.DEPTH_LIMIT
    };
  },
  computed: {
    ...mapGetters('ruleBuilder', [
      'getNestedValue',
      'getFieldError'
    ]),

    group() {
      return this.getNestedValue(this.groupPath) || {};
    },

    groupConditions() {
      return this.group.conditions || [];
    },

    groupSummary() {
      const conditionCount = this.countTotalConditions();
      return `Contains ${conditionCount} condition${conditionCount !== 1 ? 's' : ''}`;
    },

    isAtDepthLimit() {
      return this.nestingLevel >= this.maxDepthLimit;
    },

    canAddBrackets() {
      return this.groupConditions.length >= 2 &&
        !this.hasOnlyGroupsInGroup() &&
        !this.isAtDepthLimit;
    },

    canAddNestedGroup() {
      return this.groupConditions.length >= 2 &&
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
    }
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'updateNestedValue',
      'validateRule'
    ]),

    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed;
    },

    getConditionId(index) {
      const condition = this.groupConditions[index];
      return condition ? condition.id : `group-condition-${index}`;
    },

    isGroupCondition(index) {
      const condition = this.groupConditions[index];
      return condition && condition.isGroup === true;
    },

    getNestedPath(index) {
      return [...this.groupPath, 'conditions', index];
    },

    getJoinOperator(index) {
      const condition = this.groupConditions[index];
      return condition ? (condition.joinOperator || JOIN_OPERATOR.AND) : JOIN_OPERATOR.AND;
    },

    countTotalConditions() {
      if (!this.groupConditions) return 0;

      let count = 0;
      for (const condition of this.groupConditions) {
        if (condition.isGroup && condition.conditions) {
          // For groups, count nested conditions
          count += condition.conditions.length;
        } else {
          count++;
        }
      }
      return count;
    },

    updateJoinOperator(index, value) {
      // Update the join operator for this condition
      this.updateNestedValue({
        path: [...this.groupPath, 'conditions', index, 'joinOperator'],
        value
      });

      // Update group's join operator to keep consistent
      this.updateNestedValue({
        path: [...this.groupPath, 'joinOperator'],
        value
      });

      // If more than 2 conditions, keep join operators consistent
      if (this.groupConditions.length > 2) {
        for (let i = 0; i < this.groupConditions.length; i++) {
          if (i !== index) {
            this.updateNestedValue({
              path: [...this.groupPath, 'conditions', i, 'joinOperator'],
              value
            });
          }
        }
      }

      // Validate after update
      this.validateRule();
    },

    hasOnlyGroupsInGroup() {
      return this.groupConditions.length > 0 &&
        this.groupConditions.every(c => c.isGroup);
    },

    createNewCondition() {
      return {
        id: RuleService.generateId(),
        field: RULE_FIELDS.URI_PATH,
        operator: CONDITION_OPERATOR.EQUALS,
        value: '',
        isGroup: false,
        joinOperator: this.group.joinOperator || JOIN_OPERATOR.AND
      };
    },

    addCondition() {
      const newCondition = this.createNewCondition();
      const newConditions = [...this.groupConditions, newCondition];

      this.updateNestedValue({
        path: [...this.groupPath, 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    removeGroupCondition(index) {
      const newConditions = [...this.groupConditions];
      newConditions.splice(index, 1);

      // If we removed the last condition, add a new one
      if (newConditions.length === 0) {
        newConditions.push(this.createNewCondition());
      }

      this.updateNestedValue({
        path: [...this.groupPath, 'conditions'],
        value: newConditions
      });

      // Validate after update
      this.validateRule();
    },

    bracketGroupConditions() {
      if (this.isAtDepthLimit) {
        this.$message.warning(`Cannot add brackets - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      // Create a nested group from the existing conditions
      const nestedGroup = {
        id: RuleService.generateId(),
        isGroup: true,
        joinOperator: this.group.joinOperator || JOIN_OPERATOR.AND,
        conditions: JSON.parse(JSON.stringify(this.groupConditions))
      };

      // Clear current conditions and add the nested group with a new condition
      const newConditions = [
        nestedGroup,
        this.createNewCondition()
      ];

      this.updateNestedValue({
        path: [...this.groupPath, 'conditions'],
        value: newConditions
      });

      // Update join operator
      this.updateNestedValue({
        path: [...this.groupPath, 'joinOperator'],
        value: JOIN_OPERATOR.AND
      });

      // Validate after update
      this.validateRule();
    },

    addNestedGroup() {
      if (this.isAtDepthLimit) {
        this.$message.warning(`Cannot add nested group - maximum nesting depth of ${this.maxDepthLimit} reached.`);
        return;
      }

      let newConditions;

      if (this.groupConditions.length >= 1) {
        // Use the last condition for the new group
        const lastCondition = this.groupConditions[this.groupConditions.length - 1];

        // Create new group with last condition and a new one
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: JOIN_OPERATOR.AND,
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            this.createNewCondition()
          ]
        };

        // Remove last condition and add the new group
        newConditions = [
          ...this.groupConditions.slice(0, -1),
          newGroup
        ];
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

        newConditions = [...this.groupConditions, newGroup];
      }

      // Update the group
      this.updateNestedValue({
        path: [...this.groupPath, 'conditions'],
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