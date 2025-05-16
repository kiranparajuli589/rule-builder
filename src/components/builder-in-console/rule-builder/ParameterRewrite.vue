<template>
  <div class="parameter-rewrite">
    <header>
      <h2>{{ formTitle }}</h2>
      <p>{{ formSubtitle }}</p>
    </header>
    
    <div class="parameter-list">
      <div
        v-for="(param, index) in localParameters"
        :key="index"
        class="parameter-item"
      >
        <div class="param-name-field">
          <CInput
            v-model="param.name"
            :label="primaryLabel"
            :placeholder="primaryPlaceholder"
            :is-valid="param.nameTouched ? !!isNameValid(param) : undefined"
            @blur="param.nameTouched = true; syncWithStore()"
            @input="syncWithStore"
            :invalid-feedback="$t('validation.required')"
            required
          />
        </div>

        <div class="param-value-field">
          <CInput
            v-model="param.value"
            :label="$t('domain.ReplaceValue') + '*'"
            placeholder="new-value"
            :is-valid="param.valueTouched ? !!isValueValid(param) : undefined"
            @blur="param.valueTouched = true; syncWithStore()"
            @input="syncWithStore"
            :invalid-feedback="$t('validation.required')"
            required
          />
        </div>

        <div
          v-if="localParameters.length > 1"
          class="action-button"
        >
          <a-button
            type="danger"
            ghost
            class="remove-param-btn"
            @click="removeParameter(index)"
          >
            <a-icon type="delete" />
          </a-button>
        </div>
      </div>
    </div>

    <div class="parameter-actions">
      <a-button
        type="primary"
        ghost
        class="add-param-btn"
        :disabled="isAddParameterBtnValid"
        @click="addParameter"
      >
        <a-icon type="plus" />
        {{ addButtonLabel }}
      </a-button>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'ParameterRewrite',
  props: {
    primaryLabel: {
      type: String,
      default: 'Parameter Name*'
    },
    primaryPlaceholder: {
      type: String,
      default: 'param1'
    },
    addButtonLabel: {
      type: String,
      default: 'Add Parameter'
    },
    formTitle: {
      type: String,
      required: true
    },
    formSubtitle: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      localParameters: []
    };
  },
  computed: {
    ...mapState('ruleBuilder', ['rule', 'showDialog']),
    isAddParameterBtnValid() {
      return this.localParameters.some(param => !this.isNameValid(param) || !this.isValueValid(param));
    }
  },
  watch: {
    'rule.parameters': {
      handler(newParams) {
        this.initLocalParameters(newParams);
      },
      deep: true,
      immediate: true
    },
    showDialog(newVal, oldVal) {
      if (!newVal && oldVal) {
        this.resetLocalState();
      }
    }
  },
  created() {
    this.initLocalParameters(this.rule.parameters);
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'updateParameters',
      'validateRule'
    ]),

    initLocalParameters(params) {
      if (!params || params.length === 0) {
        this.localParameters = [this.createEmptyParameter()];
        this.syncWithStore();
        return;
      }

      // Only initialize if local state is empty or different
      if (this.localParameters.length === 0 ||
        JSON.stringify(this.cleanParameters()) !== JSON.stringify(params)) {
        this.localParameters = params.map(p => ({
          name: p.name || '',
          value: p.value || '',
          nameTouched: false,
          valueTouched: false
        }));
      }
    },

    resetLocalState() {
      this.localParameters = [];
    },

    createEmptyParameter() {
      return {
        name: '',
        value: '',
        nameTouched: false,
        valueTouched: false
      };
    },

    cleanParameters() {
      return this.localParameters.map(p => ({
        name: p.name,
        value: p.value
      }));
    },

    syncWithStore() {
      this.updateParameters(this.cleanParameters());
      this.validateRule();
    },

    isNameValid(param) {
      console.log('here', param, {status: param.name && param.name.trim() !== '' })
      return param.name && param.name.trim() !== '';
    },

    isValueValid(param) {
      return param.value && param.value.trim() !== '';
    },

    addParameter() {
      this.localParameters.push(this.createEmptyParameter());
      this.syncWithStore();
    },

    removeParameter(index) {
      this.localParameters.splice(index, 1);

      if (this.localParameters.length === 0) {
        this.localParameters.push(this.createEmptyParameter());
      }

      this.syncWithStore();
    }
  }
};
</script>

<style lang="scss">
.parameter-rewrite {
  display: flex;
  flex-direction: column;

  .parameter-list {
    display: flex;
    flex-direction: column;
    gap: .875rem;
    margin-bottom: 2rem;

    .parameter-item {
      display: flex;
      align-items: start;
      gap: .875rem;


      .param-name-field,
      .param-value-field {
        flex: 1;
      }

      .action-button {
        padding-top: 29px;
      }
    }
  }

  .parameter-actions {
    display: flex;
    justify-content: end;
    align-items: center;
    flex-wrap: wrap;

    .add-param-btn {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
  }
}
</style>