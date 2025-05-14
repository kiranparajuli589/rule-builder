import { mapActions, mapGetters } from "vuex";
import RuleService from "@/views/domain/rule-builder/RuleService";

export const RuleBuilderMixin = {
  data: () => ({
    rule: {
      name: '',
      ...RuleService.initializeRule(),
    },
    isEnforcingDepthLimit: false,
    showDepthWarning: false,
    lastEnforcementTime: 0
  }),
  computed: {
    ...mapGetters({
      storeRule: "ruleBuilder/getRule",
      dialogState: "ruleBuilder/getDialogState",
      builderMeta: "ruleBuilder/getMeta",
    }),
    isForEdit() {
      return !!this.rule?.id;
    },
    show: {
      get() {
        return this.dialogState;
      },
      set(value) {
        this.setDialogState(value);
      }
    },
    RuleService() {
      return RuleService
    },
    currentDepth() {
      return RuleService.calculateDepth(this.rule.create_pattern.conditions);
    },
  },
  watch: {
    storeRule: {
      immediate: true,
      handler(newVal) {
        this.rule = Object.keys(newVal ?? {}).length ? { ...newVal } : this.newRule;
      }
    }
  },
  methods: {
    ...mapActions({
      setRule: "ruleBuilder/setRule",
      setDialogState: "ruleBuilder/setDialogState",
    }),
    clearRule() {
      this.setRule();
    },
    onSubmit() {
      this.show = false;
    },
    onClose() {
      this.clearRule();
      this.show = false;
    },
    resetForm() {
      this.rule = this.newRule;
      this.showDepthWarning = false;
    },
    updateCreatePatternConditions(conditions) {
      this.rule.create_pattern.conditions = conditions;
    },
    checkDepthLimit() {
      const depth = this.currentDepth;
      const now = Date.now();

      if (depth > RuleService.DEPTH_LIMIT && (now - this.lastEnforcementTime > 1000)) {
        console.warn(`Rule depth (${depth}) exceeds limit (${RuleService.DEPTH_LIMIT}). Enforcing depth limit...`);

        this.isEnforcingDepthLimit = true;
        this.lastEnforcementTime = now;

        try {
          // Make a copy and enforce limits
          const limitedRule = RuleService.enforceDepthLimit({
            create_pattern: {
              conditions: JSON.parse(JSON.stringify(this.rule.create_pattern.conditions))
            }
          });

          this.rule.create_pattern.conditions = limitedRule.create_pattern.conditions;

          if (depth > RuleService.DEPTH_LIMIT + 1) {
            alert(`Your rule exceeded the maximum nesting depth of ${RuleService.DEPTH_LIMIT}. It has been automatically simplified.`);
          }

          this.showDepthWarning = true;
        } catch (error) {
          console.error('Error enforcing depth limit:', error);
        } finally {
          this.$nextTick(() => {
            this.isEnforcingDepthLimit = false;
          });
        }
      }
    },
  }
}