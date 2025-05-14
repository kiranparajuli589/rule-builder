<template>
    <a-modal
      v-model="show"
      :title="isForEdit ? $t('domain.EditRule') : $t('domain.CreateRule')"
      :width="'80vw'"
      :mask-closable="false"
      centered
      :after-close="() => clearRule()"
      :footer="null"
      id="rule-builder"
    >
      <form class="rule-builder-container" @submit.prevent="onSubmit()">

        <div class="form-content">
          <TipsCard />

          <div v-if="showDepthWarning" class="global-depth-warning">
            <div class="alert alert-warning">
              <strong>Warning:</strong> Your rule is at or near the maximum nesting depth of {{ RuleService.DEPTH_LIMIT }}.
              Further nesting may be limited.
              <button type="button" @click="showDepthWarning = false" class="close-warning">×</button>
            </div>
          </div>

          <CInput
            v-model="rule.name"
            :label="$t('domain.RuleName')"
            :placeholder="$t('domain.RuleNamePlaceholder')"
            required
          />

          <div class="section">
            <h2>Create Pattern</h2>
            <create-pattern-builder
              :conditions="rule.create_pattern.conditions"
              @update:conditions="updateCreatePatternConditions"
            />
          </div>

          <div class="section" v-if="$chainer('builderMeta?.configKey') === REWRITE_RULES.PATH">
            <h2>Replace Pattern</h2>
            <replace-pattern-builder
              :pattern="replace_pattern"
              @update:pattern="updateReplacePattern"
            />
          </div>
          <div
            class="section"
            v-if="[REWRITE_RULES.HEADER, REWRITE_RULES.QUERY].includes($chainer('builderMeta?.configKey'))"
          >
            <query-rewrite
              :config="ex_rewrite"
              v-bind="builderMeta"
            />
          </div>
<!--          <pre><code>-->
<!--            {{JSON.stringify({builderMeta}, null, 2)}}-->
<!--          </code></pre>-->

          <div class="actions">
            <button type="submit" class="ant-btn ant-btn-primary">
              {{ isForEdit ? $t('domain.Update') : $t('domain.Create') }}
            </button>
            <a-button @click="resetForm">
              {{ $t('domain.Reset') }}
            </a-button>
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
        </div>
      </form>
    </a-modal>
</template>

<script>
import RuleService from "@/views/domain/rule-builder/RuleService";
import { RuleBuilderMixin } from "@/views/domain/rule-builder/RuleBuilderMixin";
import { REWRITE_RULES } from "@/utilities/constants";
import { OptionalChainerMixin } from "@/mixins/OptionalChainerMixin";
import { ReplacePatternMixin } from "@/views/domain/rule-builder/ReplacePatternMixin";

export default {
  name: "RuleBuilder",
  components: {
    QueryRewrite: () => import("@/views/domain/EditDomain/gaius-rewrite/QueryRewrite.vue"),
    TipsCard: () => import("./TipsCard.vue"),
    CreatePatternBuilder: () => import("./CreatePatternBuilder.vue"),
    ReplacePatternBuilder: () => import("./ReplacePatternBuilder.vue"),
  },
  computed: {
    REWRITE_RULES() {
      return REWRITE_RULES
    },
    newRule() {
      return {
        name: '',
        ...RuleService.initializeRule(),

      };
    }
  },
  mixins: [RuleBuilderMixin, OptionalChainerMixin, ReplacePatternMixin],
  methods: {
    
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
      if (this.currentDepth > RuleService.DEPTH_LIMIT) {
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

    formatRuleForSubmission() {
      const formattedRule = JSON.parse(JSON.stringify(this.rule));

      // Format logic here if needed

      return formattedRule;
    },
  }
}
</script>