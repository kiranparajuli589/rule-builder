<template>
  <div class="accordions">
    <template v-if="isEnabled">
      <div
        class="accordion-x"
        v-for="(accordion, index) in accordions"
        :key="accordion.name"
      >
        <div
          class="accordion-x__header"
          @click="toggleAccordion(index)"
        >
          <div class="title">
            <div class="d-flex align-items-center gap-4 grow">
              <h4>{{ accordion.name }}</h4>

              <span class="tonal">
                {{ getRuleCount(accordion.value) }} {{ $t('rule.Rules') }}
              </span>
            </div>

            <a-icon
              type="down"
              :class="{
                'rotate-180': accordion.show,
                'rotate-0': !accordion.show,
              }"
            />
          </div>
          <div class="subtitle">
            <p>{{ accordion.description }}</p>
          </div>
        </div>
        <transition name="accordion">
          <div
            class="accordion-x__content"
            v-if="accordion.show"
          >
            <rule-list
              :rules="getRules(accordion.value)"
              :config-key="accordion.value"
              @create="handleCreateRule(accordion)"
              @edit="handleEditRule($event, accordion)"
              @delete="handleDeleteRule"
              @toggle-status="handleToggleStatus"
              :empty-text="$t('domain.noRules')"
            />
          </div>
        </transition>
      </div>
    </template>
    <simple-empty v-else>
      <span slot="description">{{ $t('message.PluginNotActive') }}</span>
    </simple-empty>

    <rule-builder-dialog @rule-submit="submitRule" />
  </div>
</template>

<script>
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
      accordions: [
        {
          name: this.$t("domain.PathRewrite"),
          description: this.$t("domain.PathRewriteDescription"),
          value: REWRITE_RULES.PATH,
          show: false,
          meta: {
            configKey: REWRITE_RULES.PATH,
            replacePatternType: 'standard'
          }
        },
        {
          name: this.$t("domain.QueryRewrite"),
          description: this.$t("domain.QueryRewriteDescription"),
          value: REWRITE_RULES.QUERY,
          show: false,
          meta: {
            configKey: REWRITE_RULES.QUERY,
            formTitle: this.$t("domain.QueryParameterModification"),
            formSubtitle: this.$t("domain.ParameterModificationDescription"),
            primaryLabel: this.$t('Name') + '*',
            primaryPlaceholder: "param1",
            addButtonLabel: this.$t('domain.AddParameter'),
            replacePatternType: 'parameters'
          }
        },
        {
          name: this.$t("domain.HeaderRewrite"),
          description: this.$t("domain.HeaderRewriteDescription"),
          value: REWRITE_RULES.HEADER,
          show: false,
          meta: {
            configKey: REWRITE_RULES.HEADER,
            formTitle: this.$t("domain.HeaderModification"),
            formSubtitle: this.$t("domain.HeaderModificationDescription"),
            primaryLabel: `${this.$t('Name')}*`,
            primaryPlaceholder: "header1",
            addButtonLabel: this.$t('domain.AddHeader'),
            replacePatternType: 'parameters'
          }
        }
      ]
    };
  },
  computed: {
    REWRITE_RULES() {
      return REWRITE_RULES;
    }
  },
  methods: {
    ...mapActions({
      openRuleBuilder: 'ruleBuilder/openDialog'
    }),

    toggleAccordion(index) {
      if (this.accordions[index]) {
        this.accordions[index].show = !this.accordions[index].show;
      }
    },

    getRuleCount(configKey) {
      return Array.isArray(this.value?.config?.[configKey]) ?
        this.value.config[configKey].length : 0;
    },

    getRules(configKey) {
      return Array.isArray(this.value?.config?.[configKey]) ?
        this.value.config[configKey] : [];
    },

    handleCreateRule(accordion) {
      this.openRuleBuilder({
        meta: accordion.meta,
        replacePatternType: accordion.meta.replacePatternType
      });
    },

    handleEditRule(rule, accordion) {
      this.openRuleBuilder({
        rule,
        meta: accordion.meta,
        replacePatternType: accordion.meta.replacePatternType
      });
    },

    handleDeleteRule(rule, configKey) {
      if (confirm(this.$t('domain.DeleteRuleConfirmation'))) {
        // Create a copy of the rules array
        const updatedRules = [...this.getRules(configKey)];
        const index = updatedRules.findIndex(r => r.id === rule.id);

        if (index !== -1) {
          updatedRules.splice(index, 1);
          this.updateRules(updatedRules, configKey);
        }
      }
    },

    handleToggleStatus(rule, configKey) {
      // Create a copy of the rules array
      const updatedRules = [...this.getRules(configKey)];
      const index = updatedRules.findIndex(r => r.id === rule.id);

      if (index !== -1) {
        updatedRules[index] = {
          ...updatedRules[index],
          enabled: !updatedRules[index].enabled
        };
        this.updateRules(updatedRules, configKey);
      }
    },

    submitRule(rule) {
      const configKey = rule.configKey;
      const rules = [...this.getRules(configKey)];

      // Check if we're updating or creating
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
      // Create a copy of the current value
      const updatedValue = {
        ...this.value,
        config: {
          ...(this.value.config || {}),
          [configKey]: rules
        }
      };

      this.$emit('input', updatedValue);
    },

    generateId() {
      return '_' + Math.random().toString(36).substr(2, 9);
    }
  }
};
</script>

<style scoped>
.accordions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  .accordion {
    width:  100%;
  }
}
</style>