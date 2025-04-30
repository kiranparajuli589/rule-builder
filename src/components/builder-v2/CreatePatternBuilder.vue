<template>
  <div class="create-pattern-builder">
    <div v-for="(condition, index) in localConditions" :key="condition.id" class="condition-container">
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
        <JoinSelect v-model="joinOperators[index]" />
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
        v-if="localConditions.length >= 2 && !hasOnlyGroups()"
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
    };
  },
  computed: {
    RuleService() {
      return RuleService;
    },
    wouldExceedDepthLimit() {
      // Check if adding a group at top level would exceed the depth limit
      return RuleService.wouldExceedDepthLimit(this.localConditions);
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
</style>