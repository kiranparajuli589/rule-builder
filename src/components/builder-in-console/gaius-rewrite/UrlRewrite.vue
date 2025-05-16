<template>
  <div class="url-rewrite">
    <template v-if="isEnabled">
      <a-tabs default-active-key="1">
        <a-tab-pane
          v-for="tab in rewriteTabs"
          :key="tab.key"
          :tab="$t(tab.titleKey)"
        >
          <div class="tab-content">
            <div class="tab-description">
              {{ $t(tab.descriptionKey) }}
            </div>

            <rule-list
              :rules="getRules(tab.configKey)"
              :config-key="tab.configKey"
              @create="handleCreateRule(tab.configKey)"
              @edit="handleEditRule"
              @delete="handleDeleteRule"
              @toggle-status="handleToggleStatus"
              :empty-text="$t(tab.emptyTextKey)"
            />
          </div>
        </a-tab-pane>
      </a-tabs>
    </template>

    <simple-empty v-else>
      <span slot="description">{{ $t('message.PluginNotActive') }}</span>
    </simple-empty>

    <rule-builder-dialog @rule-submit="submitRule" />
  </div>
</template>

<script>
import { Modal } from "ant-design-vue";
import { mapActions } from "vuex";
import { REWRITE_RULES } from "@/utilities/constants";
import RuleList from "./RuleList.vue";
import RuleBuilderDialog from "@/views/domain/rule-builder/RuleBuilderDialog.vue";
import SimpleEmpty from "@/views/domain/SimpleEmpty";

export default {
  name: 'UrlRewrite',
  components: {
    RuleList,
    RuleBuilderDialog,
    SimpleEmpty
  },
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    isEnabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      REWRITE_RULES,
      rewriteTabs: [
        {
          key: "1",
          titleKey: "domain.PathRewrite",
          descriptionKey: "domain.PathRewriteDescription",
          configKey: REWRITE_RULES.PATH,
          emptyTextKey: "domain.PathRewriteEmptyRules"
        },
        {
          key: "2",
          titleKey: "domain.QueryRewrite",
          descriptionKey: "domain.QueryRewriteDescription",
          configKey: REWRITE_RULES.QUERY,
          emptyTextKey: "domain.QueryRewriteEmptyRules"
        },
        {
          key: "3",
          titleKey: "domain.HeaderRewrite",
          descriptionKey: "domain.HeaderRewriteDescription",
          configKey: REWRITE_RULES.HEADER,
          emptyTextKey: "domain.HeaderRewriteEmptyRules"
        }
      ]
    };
  },
  methods: {
    // The rest of your methods remain the same
    ...mapActions({
      openRuleBuilder: 'ruleBuilder/openDialog'
    }),

    getRules(configKey) {
      return Array.isArray(this.value?.config?.[configKey]) ?
        this.value.config[configKey] : [];
    },

    handleCreateRule(configKey) {
      const meta = this.getMetaForConfigKey(configKey);
      this.openRuleBuilder({
        meta,
        replacePatternType: meta.replacePatternType
      });
    },

    handleEditRule(rule) {
      const configKey = rule.meta?.configKey;
      const meta = this.getMetaForConfigKey(configKey);
      this.openRuleBuilder({
        rule,
        meta,
        replacePatternType: meta.replacePatternType
      });
    },

    handleDeleteRule(rule, configKey) {
      Modal.confirm({
        title: this.$t('ruleBuilder.DeleteRule'),
        content: this.$t('ruleBuilder.DeleteRuleConfirmation'),
        centered: true,
        onOk: () => {
          const updatedRules = [...this.getRules(configKey)];
          const index = updatedRules.findIndex(r => r.id === rule.id);

          if (index !== -1) {
            updatedRules.splice(index, 1);
            this.updateRules(updatedRules, configKey);
          }
        }
      });
    },

    handleToggleStatus(rule, configKey, checked) {
      const updatedRules = [...this.getRules(configKey)];
      const index = updatedRules.findIndex(r => r.id === rule.id);

      if (index !== -1) {
        updatedRules[index] = {
          ...updatedRules[index],
          enabled: checked
        };
        this.updateRules(updatedRules, configKey);
      }
    },

    submitRule(rule) {
      const configKey = rule?.meta?.configKey;
      const rules = [...this.getRules(configKey)];

      const existingIndex = rules.findIndex(r => r.id === rule.id);

      if (existingIndex !== -1) {
        // Update existing rule
        rules[existingIndex] = rule;
      } else {
        // Create new rule with ID
        rule.id = this.generateId();
        rule.enabled = true;
        rules.push(rule);
      }

      this.updateRules(rules, configKey);
    },

    updateRules(rules, configKey) {
      if (!configKey) return;
      this.$emit('update:input', { values: rules, configKey });
    },

    generateId() {
      return '_' + Math.random().toString(36).substr(2, 9);
    },

    getMetaForConfigKey(configKey) {
      switch(configKey) {
        case REWRITE_RULES.PATH:
          return {
            configKey,
            replacePatternType: 'standard',
            emptyText: this.$t("domain.PathRewriteEmptyRules")
          };
        case REWRITE_RULES.QUERY:
          return {
            configKey,
            formTitle: this.$t("domain.QueryParameterModification"),
            formSubtitle: this.$t("domain.ParameterModificationDescription"),
            primaryLabel: this.$t('Name') + '*',
            primaryPlaceholder: "param1",
            addButtonLabel: this.$t('domain.AddParameter'),
            replacePatternType: 'parameters',
            emptyText: this.$t("domain.QueryRewriteEmptyRules")
          };
        case REWRITE_RULES.HEADER:
          return {
            configKey,
            formTitle: this.$t("domain.HeaderModification"),
            formSubtitle: this.$t("domain.HeaderModificationDescription"),
            primaryLabel: `${this.$t('Name')}*`,
            primaryPlaceholder: "header1",
            addButtonLabel: this.$t('domain.AddHeader'),
            replacePatternType: 'parameters',
            emptyText: this.$t("domain.HeaderRewriteEmptyRules")
          };
        default:
          return { configKey, replacePatternType: 'standard' };
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.url-rewrite {
  .tab-content {
    padding: 20px 0;
  }

  .tab-description {
    margin-bottom: 20px;
    color: rgba(0, 0, 0, 0.65);
  }
}
</style>