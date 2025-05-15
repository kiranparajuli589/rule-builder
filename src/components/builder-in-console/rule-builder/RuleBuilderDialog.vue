<template>
  <a-modal
    v-model="showDialog"
    :title="isForEdit ? $t('domain.EditRule') : $t('domain.CreateRule')"
    :width="'80vw'"
    :mask-closable="false"
    centered
    :after-close="onClose"
    :footer="null"
    id="rule-builder"
  >
    <form class="rule-builder-container" @submit.prevent="handleSubmit">
      <div class="form-content">
        <TipsCard />

        <div v-if="showDepthWarning" class="global-depth-warning">
          <div class="alert alert-warning">
            <strong>{{$t('ruleBuilder.Warning')}}:</strong> {{$t('ruleBuilder.DepthLimitWarning', [RuleService.DEPTH_LIMIT])}}
            Further nesting may be limited.
            <button type="button" @click="showDepthWarning = false" class="close-warning">×</button>
          </div>
        </div>

        <CInput
          v-model="localRule.name"
          :placeholder="$t('ruleBuilder.RuleNamePlaceholder')"
          :label="$t('ruleBuilder.RuleName')"
          :required="true"
          :description="$t('ruleBuilder.RuleNameDescription')"
        />

        <div class="section">
          <header>
            <h2>{{ $t('ruleBuilder.CreatePattern') }}</h2>
            <p>{{ $t('ruleBuilder.CreatePatternDescription') }}</p>
          </header>
          <create-pattern-builder
            :conditions="localRule.create_pattern.conditions"
            @update:conditions="updateCreatePatternConditions"
          />
        </div>

        <!-- Dynamic component for replace patterns -->
        <div class="section" v-if="replacePatternType === 'standard'">
          <h2>{{ $t('ruleBuilder.ReplacePattern') }}</h2>

          <!-- Standard replace pattern -->
          <replace-pattern-builder
            v-if="replacePatternType === 'standard'"
            :pattern="localRule.replace_pattern"
            @update:pattern="updateReplacePattern"
          />
        </div>

        <div class="section" v-if="replacePatternType === 'parameters'">
          <parameter-rewrite
            :parameters="localRule.parameters || []"
            @update:parameters="updateParameters"
            v-bind="meta"
          />
        </div>

        <div class="actions">
          <a-button type="primary" html-type="submit">
            {{ isForEdit ? $t('ruleBuilder.Update') : $t('ruleBuilder.Create') }}
          </a-button>
          <a-button @click="resetForm">
            {{ $t('ruleBuilder.Reset') }}
          </a-button>
        </div>

        <div class="preview-section">
          <div class="preview-readable">
            <h3>{{ $t('ruleBuilder.RulePreviewReadable') }}</h3>
            <div class="readable-rule">
              <strong>{{ $t('ruleBuilder.CreatePattern') }}:</strong>
              {{ readableCreatePattern }}
            </div>
            <div v-if="replacePatternType !== 'none'" class="readable-rule">
              <strong>{{ $t('ruleBuilder.ReplacePattern') }}:</strong>
              {{ readableReplacePattern }}
            </div>
          </div>

          <h3>{{ $t('ruleBuilder.RulePreviewJSON') }}</h3>
          <pre>{{ JSON.stringify(localRule, null, 2) }}</pre>
        </div>
      </div>
    </form>
  </a-modal>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import RuleService from "./RuleService";
import TipsCard from "./TipsCard.vue";
import CreatePatternBuilder from "./CreatePatternBuilder.vue";
import ReplacePatternBuilder from "./ReplacePatternBuilder.vue";
import ParameterRewrite from "./ParameterRewrite.vue";

export default {
  name: "RuleBuilderDialog",
  components: {
    TipsCard,
    CreatePatternBuilder,
    ReplacePatternBuilder,
    ParameterRewrite
  },
  data() {
    return {
      showDepthWarning: false,
      localRule: null,
      isEnforcingDepthLimit: false
    };
  },
  computed: {
    ...mapGetters('ruleBuilder', [
      'getDialogState',
      'getRule',
      'getMeta',
      'getReplacePatternType'
    ]),
    ...mapState('ruleBuilder', ['rule', 'meta']),

    showDialog: {
      get() {
        return this.getDialogState;
      },
      set(value) {
        this.setDialogState(value);
      }
    },

    replacePatternType() {
      return this.getReplacePatternType;
    },

    isForEdit() {
      return !!this.localRule?.id;
    },

    RuleService() {
      return RuleService;
    },

    currentDepth() {
      return RuleService.calculateDepth(this.localRule?.create_pattern?.conditions || []);
    },

    readableCreatePattern() {
      return this.localRule && this.localRule.create_pattern
        ? RuleService.formatReadableRule(
          this.localRule.create_pattern.conditions || [],
          this.localRule.create_pattern.joinOperators
        )
        : '';
    },

    readableReplacePattern() {
      if (!this.localRule) return '';

      if (this.replacePatternType === 'standard') {
        return RuleService.formatReadableReplacePattern(this.localRule.replace_pattern);
      } else if (this.replacePatternType === 'parameters') {
        // Format parameter rewrite as readable text
        const params = this.localRule.parameters || [];
        if (params.length === 0) return '';

        return params.map(p => `${p.name} = "${p.value}"`).join(', ');
      }
      return '';
    }
  },
  watch: {
    rule: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.localRule = JSON.parse(JSON.stringify(newVal));
        } else {
          this.localRule = RuleService.initializeRule();
        }
        console.log(this.localRule);
      }
    },
    currentDepth(newDepth) {
      // Show warning when approaching depth limit
      if (newDepth >= RuleService.DEPTH_LIMIT - 1) {
        this.showDepthWarning = true;
      }

      // Check if depth limit exceeded
      if (newDepth > RuleService.DEPTH_LIMIT && !this.isEnforcingDepthLimit) {
        this.enforceDepthLimit();
      }
    }
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'setDialogState',
      'setRule',
      'updateCreatePattern',
      'updateReplacePattern',
    ]),
    ...mapActions({
      'storeUpdateParameters': 'ruleBuilder/updateParameters',
    }),

    handleSubmit() {
      if (!this.localRule.name.trim()) {
        this.$message.error(this.$t('ruleBuilder.RuleNameRequired'));
        return;
      }

      if (this.currentDepth > RuleService.DEPTH_LIMIT) {
        this.$message.error(
          this.$t('ruleBuilder.RuleDepthExceeded', { limit: RuleService.DEPTH_LIMIT })
        );
        return;
      }

      if (!RuleService.validateRule(this.localRule)) {
        return;
      }

      // Success! Emit event with formatted rule
      this.$emit('rule-submit', this.formatRuleForSubmission());
      this.showDialog = false;
    },

    updateCreatePatternConditions(conditions) {
      if (this.localRule) {
        this.localRule.create_pattern.conditions = conditions;
      }
    },

    updateReplacePattern(pattern) {
      if (this.localRule) {
        this.localRule.replace_pattern = pattern;
      }
    },

    updateParameters(parameters) {
      if (this.localRule) {
        this.$set(this.localRule, 'parameters', [...parameters]);
        this.storeUpdateParameters(parameters);
      }
    },

    formatRuleForSubmission() {
      const formattedRule = JSON.parse(JSON.stringify(this.localRule));

      if (this.replacePatternType === 'none') {
        delete formattedRule.replace_pattern;
        delete formattedRule.parameters;
      } else if (this.replacePatternType === 'parameters') {
        delete formattedRule.replace_pattern;
      } else {
        delete formattedRule.parameters;
      }

      return formattedRule;
    },

    resetForm() {
      if (confirm(this.$t('ruleBuilder.ResetConfirmation'))) {
        this.localRule = RuleService.initializeRule();
        this.localRule.name = '';
        this.showDepthWarning = false;
      }
    },

    onClose() {
      this.setRule(null);
    },

    enforceDepthLimit() {
      if (this.isEnforcingDepthLimit) return;

      this.isEnforcingDepthLimit = true;
      try {
        this.localRule = RuleService.enforceDepthLimit(this.localRule);
        this.$message.warning(this.$t('ruleBuilder.RuleSimplified'));
      } catch (error) {
        console.error('Error enforcing depth limit:', error);
      } finally {
        this.$nextTick(() => {
          this.isEnforcingDepthLimit = false;
        });
      }
    },
  }
};
</script>