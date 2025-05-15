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
            :is-valid="!shouldShowError(param, 'name')"
            @blur="markAsTouched(param, 'name')"
            @input="onInputChange"
            :invalid-feedback="$t('validation.required')"
            required
          />
        </div>

        <div class="param-value-field">
          <CInput
            v-model="param.value"
            :label="$t('domain.ReplaceValue') + '*'"
            placeholder="new-value"
            :is-valid="!shouldShowError(param, 'value')"
            @blur="markAsTouched(param, 'value')"
            @input="onInputChange"
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
        @click="addParameter"
        :disabled="!isValid"
        class="add-param-btn"
      >
        <a-icon type="plus" />
        {{ addButtonLabel }}
      </a-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParameterRewrite',
  props: {
    parameters: {
      type: Array,
      default: () => []
    },
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
      localParameters: [],
      lastEmittedValue: null,
      debounceTimer: null
    };
  },
  computed: {
    isValid() {
      return this.localParameters.every(param =>
        this.validateParameter(param.name, 'name') &&
        this.validateParameter(param.value, 'value')
      );
    },

    cleanParameters() {
      return this.localParameters?.map(param => {
        return {
          name: param.name,
          value: param.value
        };
      });
    }
  },
  created() {
    this.initializeParameters();
  },
  watch: {
    parameters: {
      immediate: true,
      handler(newVal) {
        this.initializeParameters(newVal);
      }
    },
  },
  beforeDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  },
  methods: {
    initializeParameters(params) {
      const inputParams = params || [];

      if (!this.localParameters || this.localParameters.length === 0) {
        this.localParameters = inputParams.length > 0
          ? this.addTouchFlags(inputParams)
          : [this.createEmptyParameter()];

        this.lastEmittedValue = JSON.stringify(inputParams);
        return;
      }

      const currentCleanParams = this.cleanParameters;
      const inputParamsStr = JSON.stringify(inputParams);
      const currentCleanParamsStr = JSON.stringify(currentCleanParams);

      if (inputParamsStr !== currentCleanParamsStr) {
        if (inputParams.length > 0) {
          this.localParameters = this.addTouchFlags(inputParams);
        } else if (currentCleanParams.length === 0) {
          this.localParameters = [this.createEmptyParameter()];
        }

        this.lastEmittedValue = inputParamsStr;
      }
    },

    addTouchFlags(params) {
      return JSON.parse(JSON.stringify(params)).map(param => ({
        ...param,
        nameTouched: false,
        valueTouched: false
      }));
    },
    createEmptyParameter() {
      return {
        name: '',
        value: '',
        nameTouched: false,
        valueTouched: false
      };
    },

    addParameter() {
      this.localParameters.push(this.createEmptyParameter());
      this.emitParametersUpdate();
    },

    removeParameter(index) {
      this.localParameters.splice(index, 1);

      if (this.localParameters.length === 0) {
        this.localParameters.push(this.createEmptyParameter());
      }

      this.emitParametersUpdate();
    },

    validateParameter(value, _field) {
      return typeof value === 'string' && value.trim() !== '';
    },

    markAsTouched(param, field) {
      if (field === 'name') {
        param.nameTouched = true;
      } else if (field === 'value') {
        param.valueTouched = true;
      }
    },

    shouldShowError(param, field) {
      if (field === 'name') {
        return param.nameTouched && !this.validateParameter(param.name, 'name');
      } else if (field === 'value') {
        return param.valueTouched && !this.validateParameter(param.value, 'value');
      }
      return false;
    },

    onInputChange() {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.emitParametersUpdate();
      }, 300); // 300ms debounce for typing
    },

    emitParametersUpdate() {
      const cleanParams = this.cleanParameters;
      const cleanParamsStr = JSON.stringify(cleanParams);

      if (cleanParamsStr !== this.lastEmittedValue) {
        this.lastEmittedValue = cleanParamsStr;
        this.$emit('update:parameters', cleanParams);
      }
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