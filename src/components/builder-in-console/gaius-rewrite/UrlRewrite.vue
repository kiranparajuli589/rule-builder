<template>
  <div class="accordions">
    <template v-if="isEnabled">
      <div
        class="accordion"
        v-for="(accordion, index) in accordions"
        :key="accordion.name"
      >
        <div
          class="accordion__header"
          @click="toggleAccordion(index)"
        >
          <div class="title">
            <div class="d-flex align-items-center gap-4 grow">
              <h4>{{ accordion.name }}</h4>
              
              <span
                :class="'tonal'"
              >
                {{value?.config?.[accordion.value]?.length || 0}} {{$t('rule.Rules')}}
              </span>
            </div>

            <img
              src="/icons/arrow_circle_down.svg"
              alt="Accordion Arrow"
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
            class="accordion__content"
            v-if="accordion.show"
          >
            <path-rewrite
              :config="value?.config?.[accordion.value]"
              @change="handleChange"
              @update-validation-status="handleValidationUpdate"
              :meta="accordion.props"
            />
          </div>
        </transition>
      </div>
    </template>
    <simple-empty v-else>
      <span slot="description">{{ $t('message.PluginNotActive') }}</span>
    </simple-empty>

    <rule-builder />
  </div>
</template>
<script>
import {REWRITE_RULES} from "@/utilities/constants";

export default {
  name: 'UrlRewrite',
  components: {
    'rule-builder': () => import("@/views/domain/rule-builder/RuleBuilderDialog"),
    'simple-empty': () => import("@/views/domain/SimpleEmpty"),
    'path-rewrite': () => import("@/views/domain/EditDomain/gaius-rewrite/PathRewrite"),
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
  emits: ['input'],
  data() {
    return {
      accordions: [
        {
          name: this.$t("domain.PathRewrite"),
          description: this.$t("domain.PathRewriteDescription"),
          value: REWRITE_RULES.PATH,
          show: false,
          props: {
            configKey: REWRITE_RULES.PATH,
          }
        },
        {
          name: this.$t("domain.QueryRewrite"),
          description: this.$t("domain.QueryRewriteDescription"),
          value: REWRITE_RULES.QUERY,
          show: false,
          props: {
            configKey: REWRITE_RULES.QUERY,
            formTitle: this.$t("domain.ParameterModification"),
            formSubtitle: this.$t("domain.ParameterModificationDescription"),
            primaryLabel: this.$t('Name') + '*',
            primaryPlaceholder: "param1",
            addNestBtnLabel: this.$t('domain.AddParameter'),
            addNewDescription: this.$t('domain.AddMoreQueryDescription'),
            emptyRulesText: this.$t("domain.QueryRewriteEmptyRules"),
            nestKey: "params",
          }
        },
        {
          name: this.$t("domain.HeaderRewrite"),
          description: this.$t("domain.HeaderRewriteDescription"),
          value: REWRITE_RULES.HEADER,
          show: false,
          props: {
            configKey: REWRITE_RULES.HEADER,
            formTitle: this.$t("domain.HeaderModification"),
            formSubtitle: this.$t("domain.HeaderModificationDescription"),
            primaryLabel: `${this.$t('Name')}*`,
            primaryPlaceholder: "header1",
            addNestBtnLabel: this.$t('domain.AddHeader'),
            addNewDescription: this.$t('domain.AddMoreHeaderDescription'),
            emptyRulesText: this.$t("domain.QueryRewriteEmptyRules"),
            nestKey: "headers",
          }
        },
      ],
      validationStatus: {
        [REWRITE_RULES]: undefined,
        [REWRITE_RULES.PATH]: undefined,
        [REWRITE_RULES.QUERY]: undefined,
      }
    }
  },
  computed: {
    REWRITE_RULES() {
      return REWRITE_RULES;
    },
  },
  methods: {
    toggleAccordion(index) {
      if (this.accordions?.[index] && typeof this.accordions[index] === "object") {
        this.accordions[index].show = !this.accordions[index].show;
      }
    },
    handleChange({ values, key }) {
      this.$emit('input', {
        values,
        configKey: key,
      });
    },
    handleValidationUpdate({ status, key }) {
      console.log("status",{ status, key });
      this.validationStatus[key] = status;
    }
  }
}
</script>
<style lang="scss" scoped>
.accordions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
