<template>
  <div class="tipscard">
    <transition name="curtain">
      <div v-if="showTips" class="tipscard__container">
        <div class="tipscard__header">
          <h3>{{ $t('ruleBuilder.RuleBuilderTips') }}</h3>
          <div class="tipscard__controls">
            <a-button class="tipscard__closebtn" @click="toggleTips" type="link">
              <CIcon name="cil-x-circle" />
            </a-button>
          </div>
        </div>
        <div class="tipscard__content">
          <div class="tipscard__section">
            <h4>{{ $t('ruleBuilder.HowToBuildRules') }}</h4>
            <ul>
              <li>{{ $t('ruleBuilder.TipStartSimple') }}</li>
              <li>{{ $t('ruleBuilder.TipAddSecondCondition') }}</li>
              <li>{{ $t('ruleBuilder.TipUseBrackets') }}</li>
              <li>{{ $t('ruleBuilder.TipAddGroups') }}</li>
            </ul>
          </div>
          <div class="tipscard__section">
            <h4>{{ $t('ruleBuilder.RuleStructure') }}</h4>
            <ul>
              <li><strong>{{ $t('ruleBuilder.CreatePattern') }}:</strong> {{ $t('ruleBuilder.TipCreatePattern') }}</li>
              <li><strong>{{ $t('ruleBuilder.ReplacePattern') }}:</strong> {{ $t('ruleBuilder.TipReplacePattern') }}</li>
              <li>{{ $t('ruleBuilder.TipNestedConditions') }}</li>
            </ul>
          </div>
          <div class="tipscard__section">
            <h4>{{ $t('ruleBuilder.Operators') }}</h4>
            <ul>
              <li><code>==</code>: {{ $t('ruleBuilder.OperatorEquals') }}</li>
              <li><code>!=</code>: {{ $t('ruleBuilder.OperatorNotEquals') }}</li>
              <li><code>~~</code>: {{ $t('ruleBuilder.OperatorContains') }}</li>
              <li><code>starts_with</code>: {{ $t('ruleBuilder.OperatorStartsWith') }}</li>
              <li><code>ends_with</code>: {{ $t('ruleBuilder.OperatorEndsWith') }}</li>
            </ul>
          </div>
        </div>

        <div class="tipscard__advancedinfo">
          <h4>{{ $t('ruleBuilder.AdvancedRuleBuilding') }}</h4>

          <div class="tipscard__inforow">
            <div class="tipscard__infoitem">
              <div class="tipscard__infoitem__title">
                <a-icon type="appstore" />
                <strong>{{ $t('ruleBuilder.AddGroup') }}</strong>
              </div>
              <p class="tipscard__infoitem__description">{{ $t('ruleBuilder.AddGroupDescription') }}</p>
              <div class="tipscard__infoitem__example">
                <div class="tipscard__infoitem__example__label">{{ $t('ruleBuilder.Example') }}:</div>
                <p class="tipscard__infoitem__example__content">{{ $t('ruleBuilder.AddGroupExample') }}</p>
              </div>
              <div class="tipscard__infoitem__tip">
                <a-icon type="info-circle" />
                <span>{{ $t('ruleBuilder.AddGroupTip') }}</span>
              </div>
            </div>

            <div class="tipscard__infoitem">
              <div class="tipscard__infoitem__title">
                <a-icon type="border-outer" />
                <strong>{{ $t('ruleBuilder.BracketConditions') }}</strong>
              </div>
              <p class="tipscard__infoitem__description">{{ $t('ruleBuilder.BracketConditionsDescription') }}</p>
              <div class="tipscard__infoitem__example">
                <div class="tipscard__infoitem__example__label">{{ $t('ruleBuilder.Example') }}:</div>
                <p class="tipscard__infoitem__example__content">{{ $t('ruleBuilder.BracketConditionsExample') }}</p>
              </div>
              <div class="tipscard__infoitem__tip">
                <a-icon type="info-circle" />
                <span>{{ $t('ruleBuilder.BracketConditionsTip') }}</span>
              </div>
            </div>
          </div>

          <div class="tipscard__inforow">
            <div class="tipscard__infoitem">
              <div class="tipscard__infoitem__title">
                <a-icon type="fork" />
                <strong>{{ $t('ruleBuilder.LogicalOperators') }}</strong>
              </div>
              <p class="tipscard__infoitem__description">{{ $t('ruleBuilder.LogicalOperatorsDescription') }}</p>
              <div class="tipscard__infoitem__example">
                <div class="tipscard__infoitem__example__label">{{ $t('ruleBuilder.Example') }}:</div>
                <p class="tipscard__infoitem__example__content">{{ $t('ruleBuilder.LogicalOperatorsExample') }}</p>
              </div>
              <div class="tipscard__infoitem__tip">
                <a-icon type="info-circle" />
                <span>{{ $t('ruleBuilder.LogicalOperatorsTip') }}</span>
              </div>
            </div>

            <div class="tipscard__infoitem">
              <div class="tipscard__infoitem__title">
                <a-icon type="swap" />
                <strong>{{ $t('ruleBuilder.JoinOperatorSync') }}</strong>
              </div>
              <p class="tipscard__infoitem__description">{{ $t('ruleBuilder.JoinOperatorSyncDescription') }}</p>
              <div class="tipscard__infoitem__example">
                <div class="tipscard__infoitem__example__label">{{ $t('ruleBuilder.Example') }}:</div>
                <p class="tipscard__infoitem__example__content">{{ $t('ruleBuilder.JoinOperatorSyncExample') }}</p>
              </div>
              <div class="tipscard__infoitem__tip">
                <a-icon type="info-circle" />
                <span>{{ $t('ruleBuilder.JoinOperatorSyncTip') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tipscard__footer">
          <a href="https://www.lua.org/manual/5.3/manual.html#3.4.4" target="_blank" rel="noopener" class="tipscard__link">
            <span>{{ $t('ruleBuilder.LuaDocumentation') }}</span>
            <a-icon type="export" />
          </a>
          <a href="#" class="tipscard__link">
            <span>{{ $t('ruleBuilder.RuleBuildingTutorial') }}</span>
            <a-icon type="export" />
          </a>
        </div>
      </div>
    </transition>

    <div v-if="!showTips" class="tipscard__badge" @click="toggleTips">
      <a-icon type="bulb" class="tipscard__badge__icon" />
      <span class="tipscard__badge__text">{{ $t('ruleBuilder.ShowTips') }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TipsCard',
  data() {
    return {
      showTips: true,
      hideTips: false
    };
  },
  created() {
    const hideTips = localStorage.getItem('ruleTipsHidden');
    if (hideTips === 'true') {
      this.showTips = false;
      this.hideTips = true;
    }
  },
  methods: {
    toggleTips() {
      this.showTips = !this.showTips;
      this.hideTips = !this.showTips;

      localStorage.setItem('ruleTipsHidden', this.hideTips);
    }
  }
};
</script>

<style lang="scss" scoped>
@use "~@/assets/scss/rule_builder_tips" as *;
</style>