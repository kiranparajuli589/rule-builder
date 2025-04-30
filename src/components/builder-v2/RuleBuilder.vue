<template>
  <div class="rule-builder-container">
    <TipsCard />

    <form @submit.prevent="submitRule">
      <div class="section">
        <h2>Create Pattern</h2>
        <create-pattern-builder
          :conditions="rule.create_pattern.conditions"
          @update:conditions="updateCreatePatternConditions"
        />
      </div>

      <div class="section">
        <h2>Replace Pattern</h2>
        <replace-pattern-builder
          :pattern="rule.replace_pattern"
          @update:pattern="updateReplacePattern"
        />
      </div>

      <div class="actions">
        <button type="submit" class="btn-primary">Save Rule</button>
        <button type="button" class="btn-secondary" @click="resetForm">Reset</button>
      </div>

      <div class="preview-section">
        <div class="preview-readable">
          <h3>Rule Preview (Readable)</h3>
          <div class="readable-rule">
            <strong>Create Pattern:</strong>
            {{ RuleService.formatReadableRule(rule.create_pattern.conditions, rule.create_pattern.joinOperators) }}
          </div>
          <div class="readable-rule">
            <strong>Replace Pattern:</strong> {{ RuleService.formatReadableReplacePattern(rule.replace_pattern) }}
          </div>
        </div>

        <h3>Rule Preview (JSON)</h3>
        <pre>{{ JSON.stringify(rule, null, 2) }}</pre>
      </div>
    </form>
  </div>
</template>

<script>
import CreatePatternBuilder from './CreatePatternBuilder.vue';
import ReplacePatternBuilder from './ReplacePatternBuilder.vue';
import RuleService from "../../services/RuleService.js";
import TipsCard from "@//components/builder-v2/TipsCard.vue";

export default {
  name: 'RuleBuilder',
  computed: {
    RuleService() {
      return RuleService
    }
  },
  components: {
    TipsCard,
    CreatePatternBuilder,
    ReplacePatternBuilder
  },
  data() {
    return {
      rule: RuleService.initializeRule(),
      isEnforcingDepthLimit: false // Flag to prevent infinite loops
    };
  },
  created() {
    // Check if there's initial data to load
    if (this.$route && this.$route.params && this.$route.params.initialRule) {
      this.loadInitialRule(this.$route.params.initialRule);
    }
  },
  watch: {
    'rule.create_pattern.conditions': {
      handler(newConditions) {
        // Only check depth if we're not already enforcing it
        if (!this.isEnforcingDepthLimit) {
          this.checkDepthLimit();
        }
      },
      deep: true
    }
  },
  methods: {
    updateCreatePatternConditions(conditions) {
      this.rule.create_pattern.conditions = conditions;
    },
    updateReplacePattern(pattern) {
      this.rule.replace_pattern = pattern;
    },
    loadInitialRule(initialRule) {
      // Deep copy to avoid reference issues
      let ruleCopy = JSON.parse(JSON.stringify(initialRule));

      // Enforce depth limit on loaded rules
      if (RuleService.calculateDepth(ruleCopy.create_pattern.conditions) > RuleService.DEPTH_LIMIT) {
        // Alert the user that we're modifying their rule to comply with depth limits
        alert(`The loaded rule exceeds the maximum nesting depth of ${RuleService.DEPTH_LIMIT}. The rule will be simplified to comply with the depth limit.`);

        // Enforce the depth limit
        this.isEnforcingDepthLimit = true;
        ruleCopy = RuleService.enforceDepthLimit(ruleCopy);
        this.isEnforcingDepthLimit = false;
      }

      this.rule = ruleCopy;
    },
    submitRule() {
      // Enforce depth limit before validation
      if (RuleService.calculateDepth(this.rule.create_pattern.conditions) > RuleService.DEPTH_LIMIT) {
        alert(`Your rule exceeds the maximum nesting depth of ${RuleService.DEPTH_LIMIT}. Please simplify your rule structure.`);
        return;
      }

      // Validate rule
      if (RuleService.validateRule(this.rule)) {
        // Format the rule to send to backend
        const formattedRule = this.formatRuleForSubmission();
        // Send to backend - mock for now
        console.log('Submitting rule:', formattedRule);
        alert('Rule submitted successfully!');
      }
    },

    // Add a new method to detect if the rule's depth has been exceeded
    checkDepthLimit() {
      const depth = RuleService.calculateDepth(this.rule.create_pattern.conditions);
      if (depth > RuleService.DEPTH_LIMIT) {
        console.warn(`Rule depth (${depth}) exceeds limit (${RuleService.DEPTH_LIMIT}). Enforcing depth limit...`);

        // Set flag to prevent circular processing
        this.isEnforcingDepthLimit = true;

        try {
          // Make a copy and enforce limits
          const limitedRule = RuleService.enforceDepthLimit({
            create_pattern: {
              conditions: JSON.parse(JSON.stringify(this.rule.create_pattern.conditions))
            }
          });

          // Apply the limited rule back to our rule object
          this.rule.create_pattern.conditions = limitedRule.create_pattern.conditions;
        } catch (error) {
          console.error('Error enforcing depth limit:', error);
        } finally {
          // Always reset the flag
          this.$nextTick(() => {
            this.isEnforcingDepthLimit = false;
          });
        }
      }
    },

    formatRuleForSubmission() {
      // Create a copy of the rule to format
      const formattedRule = JSON.parse(JSON.stringify(this.rule));

      // Format logic here if needed

      return formattedRule;
    },
    resetForm() {
      this.rule = RuleService.initializeRule();
    },
  }
}
</script>