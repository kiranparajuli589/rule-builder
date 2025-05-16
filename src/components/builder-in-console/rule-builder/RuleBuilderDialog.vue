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
            <button type="button" @click="showDepthWarning = false" class="close-warning">×</button>
          </div>
        </div>

        <!-- Show global validation errors -->
        <div v-if="hasGlobalErrors" class="global-validation-errors">
          <div class="alert alert-danger">
            <strong>{{$t('ruleBuilder.ValidationErrors')}}:</strong>
            <ul>
              <li v-for="error in globalErrors" :key="error.field">
                {{ error.message }}
              </li>
            </ul>
          </div>
        </div>

        <CInput
          id="rule-name"
          :value="rule.name"
          :placeholder="$t('ruleBuilder.RuleNamePlaceholder')"
          @input="handleNameInput($event)"
          @blur="handleNameBlur"
          :is-valid="nameTouched ? !nameError : undefined"
          :invalid-feedback="nameTouched ? nameError : undefined"
          :label="$t('ruleBuilder.RuleName')"
          :required="true"
        />

        <div class="section">
          <header>
            <h2>{{ $t('ruleBuilder.CreatePattern') }}</h2>
            <p>{{ $t('ruleBuilder.CreatePatternDescription') }}</p>
          </header>
          <create-pattern-builder />
        </div>

        <!-- Dynamic component for replace patterns -->
        <div class="section" v-if="replacePatternType === 'standard'">
          <header>
            <h2>{{ $t('ruleBuilder.ReplacePattern') }}</h2>
            <p>{{ $t('ruleBuilder.ReplacePatternDescription') }}</p>
          </header>

          <!-- Standard replace pattern -->
          <replace-pattern-builder />
        </div>

        <div class="section" v-if="replacePatternType === 'parameters'">
          <parameter-rewrite
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
          <pre>{{ JSON.stringify(rule, null, 2) }}</pre>
        </div>
      </div>

      <div class="bottom-space" />
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
import { Modal } from "ant-design-vue";

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
      isFormDirty: false,
      originalRuleState: null,
      nameTouched: false,
      nameError: null
    };
  },
  computed: {
    ...mapState('ruleBuilder', [
      'rule',
      'meta',
      'validationErrors'
    ]),
    ...mapGetters('ruleBuilder', [
      'getDialogState',
      'getReplacePatternType',
      'getFieldError'
    ]),

    showDialog: {
      get() {
        return this.getDialogState;
      },
      set(value) {
        if (!value) {
          this.onClose();
        } else {
          this.setDialogState(value);
        }
      }
    },

    replacePatternType() {
      return this.getReplacePatternType;
    },

    isForEdit() {
      return !!this.rule?.id;
    },

    RuleService() {
      return RuleService;
    },

    currentDepth() {
      return RuleService.calculateDepth(this.rule?.create_pattern?.conditions || []);
    },

    readableCreatePattern() {
      return this.rule && this.rule.create_pattern
        ? RuleService.formatReadableRule(
          this.rule.create_pattern.conditions || []
        )
        : '';
    },

    readableReplacePattern() {
      if (!this.rule) return '';

      if (this.replacePatternType === 'standard') {
        return RuleService.formatReadableReplacePattern(this.rule.replace_pattern);
      } else if (this.replacePatternType === 'parameters') {
        // Format parameter rewrite as readable text
        const params = this.rule.parameters || [];
        if (params.length === 0) return '';

        return params.map(p => `${p.name} = "${p.value}"`).join(', ');
      }
      return '';
    },

    hasGlobalErrors() {
      return this.globalErrors.length > 0;
    },

    globalErrors() {
      return this.validationErrors;
    }
  },
  watch: {
    showDialog(v) {
      if (v) {
        console.log("original state", JSON.parse(JSON.stringify(this.rule)))
        this.originalRuleState = JSON.parse(JSON.stringify(this.rule));
        this.isFormDirty = false;
      }
    },
    rule: {
      handler(newVal) {
        if (newVal && this.originalRuleState) {
          this.isFormDirty = JSON.stringify(newVal) !== JSON.stringify(this.originalRuleState);
        } else {
          this.isFormDirty = false;
        }
      },
      deep: true
    },
  },
  methods: {
    ...mapActions('ruleBuilder', [
      'setDialogState',
      'setRule',
      'validateRule',
      'updateNestedValue'
    ]),

    handleNameInput(event) {
      const value = event.target ? event.target.value : event;

      // Only set dirty flag if value actually changed
      const currentName = this.originalRuleState?.name || '';
      if (value !== currentName) {
        this.isFormDirty = true;
      }

      this.updateNestedValue({
        path: ['name'],
        value
      });
      

      if (this.nameTouched) {
        this.validateName(value);
      }

      this.validateRule();
    },

    handleNameBlur() {
      this.nameTouched = true;
      this.validateName(this.rule.name);
      this.validateRule();
    },

    validateName(value) {
      this.nameError = null;

      if (!value || value.trim() === '') {
        this.nameError = this.$t('ruleBuilder.RuleNameRequired');
        return false;
      }
      
      // at lest 3 characters
      if (value.length < 3) {
        this.nameError = this.$t('validation.minLength', [3]);
        return false;
      }

      return true;
    },

    handleSubmit() {
      this.nameTouched = true;
      this.validateName(this.rule.name);

      this.validateRule();

      if (this.nameError || this.validationErrors.length > 0) {
        this.$message.error(this.$t('ruleBuilder.FixValidationErrors'));
        return;
      }

      // Success! Emit event with formatted rule
      this.$emit('rule-submit', this.formatRuleForSubmission());

      // After successful submit, reset the dirty state
      this.isFormDirty = false;
      this.showDialog = false;
    },

    formatRuleForSubmission() {
      const formattedRule = JSON.parse(JSON.stringify(this.rule));

      if (this.replacePatternType === 'none') {
        delete formattedRule.replace_pattern;
        delete formattedRule.parameters;
      } else if (this.replacePatternType === 'parameters') {
        delete formattedRule.replace_pattern;
      } else {
        delete formattedRule.parameters;
      }

      return {
        ...formattedRule,
        meta: this.meta,
      };
    },

    resetForm() {
      Modal.confirm({
        title: this.$t('ruleBuilder.ResetRule'),
        content: this.$t('ruleBuilder.ResetConfirmation'),
        okText: this.$t('Yes'),
        cancelText: this.$t('No'),
        okType: 'danger',
        iconType: 'reload',
        centered: true,
        onOk: () => {
          // Reset form to original state by reloading from store
          this.setRule(this.originalRuleState)

          // Reset touched state
          this.nameTouched = false;
          this.nameError = null;

          this.isFormDirty = false;
        }
      });
    },

    onClose() {
      this.handleBeforeClose(() => {
        this.setRule(null);
        this.isFormDirty = false;
        this.originalRuleState = null;
        this.setDialogState(false);
        this.showDepthWarning = false;

        // Reset touched state
        this.nameTouched = false;
        this.nameError = null;
      });
    },

    handleBeforeClose(done) {
      if (this.isFormDirty) {
        Modal.confirm({
          title: this.$t('ruleBuilder.UnsavedChanges'),
          content: this.$t('ruleBuilder.UnsavedChangesWarning'),
          okText: this.$t('Yes'),
          okType: 'danger',
          cancelText: this.$t('No'),
          centered: true,
          onOk: () => {
            done();
          }
        });
      } else {
        done();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.rule-builder-container {
  .global-validation-errors {
    margin-bottom: 20px;

    .alert-danger {
      background-color: #fff2f0;
      border: 1px solid #ffccc7;
      color: #ff4d4f;
      padding: 15px;
      border-radius: 4px;

      ul {
        margin: 10px 0 0;
        padding-left: 20px;
      }
    }
  }

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;

      &.is-invalid {
        border-color: #ff4d4f;
      }
    }

    .invalid-feedback {
      color: #ff4d4f;
      font-size: 12px;
      margin-top: 4px;
    }
  }
}
</style>