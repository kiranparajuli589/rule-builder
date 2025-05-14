<template>
  <div class="query_rewrite">
    <div class="d-flex flex-column gap-2">
      <div>
        <h5>{{formTitle}}</h5>
        <p>
          {{formSubtitle}}
        </p>
      </div>

      <div class="parameter_list">
        <div
          v-for="(param, paramIndex) in rule.parameters"
          :key="paramIndex"
          class="parameter_item"
        >
          <CInput
            v-model="param.name"
            class="grow"
            :label="primaryLabel"
            :placeholder="primaryPlaceholder"
            :description="getParameterErrorMessage(paramIndex, 'name')"
            :is-valid="isParameterFieldValid(paramIndex, 'name')"
          />

          <div class="d-flex gap-2 grow">
            <CInput
              v-model="param.value"
              class="grow"
              :label="`${$t('domain.ReplaceValue')}*`"
              placeholder="new-value"
              :description="getParameterErrorMessage(paramIndex, 'value')"
              :is-valid="isParameterFieldValid(paramIndex, 'value')"
            />

            <div class="action">
              <CButton
                v-if="rule.parameters.length > 1"
                type="button"
                color="danger"
                variant="outline"
                size="sm"
                @click.prevent="removeParameter(paramIndex)"
              >
                <CIcon name="cilTrash" height="20" width="20" />
              </CButton>
            </div>
          </div>
        </div>

        
      </div>
      <div class="parameter_actions">
        <a-button
          type="primary"
          ghost class="d-flex align-items-center gap-2"
          @click.prevent="addParameter()"
          :disabled="!isValid || isFormEmpty"
        >
          <CIcon name="cilPlus" height="20" width="20" />
          {{ addNestBtnLabel }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script>
import Joi from "joi";
import {GaiusRewritePluginFormMixin} from "@/mixins/GaiusRewritePluginFormMixin";

const emptyParameter = {
  name: undefined,
  value: undefined,
};
const emptyRule = {
  parameters: [emptyParameter]
};

export default  {
  name: 'QueryRewrite',
  props: {
    config: {
      type: Object,
      default: () => ({})
    },
    configKey: {
      type: String,
      required: true,
    },
    formTitle: {
      type: String,
      required: true
    },
    formSubtitle: {
      type: String,
      required: true
    },
    primaryLabel: {
      type: String,
      required: true
    },
    primaryPlaceholder: {
      type: String,
      required: true
    },
    nestKey: {
      type: String,
      required: true
    },
    addNestBtnLabel: {
      type: String,
      required: true
    },
    addNewDescription: {
      type: String,
      required: true
    },
    // emptyRulesText: {
    //   type: String,
    //   required: true
    // }
  },
  data: () => ({
    emptyParameter: emptyParameter,
    emptyRule: emptyRule,
    rule: {
      ...emptyRule,
    }
  }),
  mixins: [GaiusRewritePluginFormMixin],
  // components: {
  //   PrependFunctionInput: () => import("@/components/PrependFunctionInput"),
  //   SimpleEmpty: () => import("@/views/domain/SimpleEmpty"),
  // },
  created() {
    if (this.config && Object.keys(this.config).length > 0) {
      console.log(this.config);
      // this.rule = this.config.map(rule => ({
      //   ...rule,
      //   parameters: convertObjectToArray(rule.parameters)
      // }))
    }
  },
  computed: {
    isFormEmpty() {
      // return this.rules.every(rule => {
      //   re0turn !rule.pattern && rule.parameters.every(param => !param.name && !param.value);
      // });
      return this.rule.parameters.every(param => !param.name && !param.value) && !this.rule.value;
    },
    parameterSchema() {
      return Joi.object({
        name: Joi.string().required().messages({
          'string.empty': this.$t('validation.required'),
          'any.required': this.$t('validation.required')
        }),
        value: Joi.string().required().messages({
          'string.empty': this.$t('validation.required'),
          'any.required': this.$t('validation.required')
        })
      })
    },
    ruleSchema() {
      return Joi.object({
        parameters: Joi.array().items(this.parameterSchema)
      })
    },
  }
}
</script>
<style scoped lang="scss">
.query_rewrite {
  .parameter_list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .parameter_item {
    display: flex;
    align-items: end;
    gap: 1rem;
    
  }

  .parameter_actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 1rem;
  }
  .action {
    display: flex;
    align-items: end;
    justify-content: center;
    button {
      height: 35px;
      width: 35px;
    }
  }
}
</style>