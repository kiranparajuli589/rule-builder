export const RuleCleanerUtil = {
  /**
   * Clean a rule or array of rules for API submission
   * @param {Object|Array} rules - Single rule object or array of rule objects
   * @returns {Object|Array} Cleaned rule(s) ready for API
   */
  cleanForApi(rules) {
    if (Array.isArray(rules)) {
      return rules.map(rule => this.cleanSingleRule(rule));
    }
    return this.cleanSingleRule(rules);
  },

  /**
   * Clean a single rule object for API submission
   * @param {Object} rule - Rule object to clean
   * @returns {Object} Cleaned rule object
   */
  cleanSingleRule(rule) {
    if (!rule) return null;

    const cleanRule = {
      name: rule.name,
      enabled: rule.enabled !== undefined ? rule.enabled : true
    };

    if (rule.create_pattern) {
      cleanRule.create_pattern = {
        conditions: rule.create_pattern.conditions ?
          this.cleanConditions(rule.create_pattern.conditions) : []
      };
    }

    if (rule.replace_pattern) {
      cleanRule.replace_pattern = {
        field: rule.replace_pattern.field,
        value: rule.replace_pattern.value,
        withFn: rule.replace_pattern.withFn || false
      };

      if (cleanRule.replace_pattern.withFn) {
        cleanRule.replace_pattern.fn = rule.replace_pattern.fn;
        cleanRule.replace_pattern.fnArg = rule.replace_pattern.fnArg;
      }
    }

    if (rule.parameters && Array.isArray(rule.parameters)) {
      cleanRule.parameters = rule.parameters.map(param => ({
        name: param.name,
        value: param.value
      }));
    }

    return cleanRule;
  },

  /**
   * Recursively clean condition objects
   * @param {Array} conditions - Array of condition objects
   * @returns {Array} Cleaned condition objects
   */
  cleanConditions(conditions) {
    if (!conditions || !Array.isArray(conditions)) return [];

    return conditions.map(condition => {
      const cleanCondition = {
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        isGroup: condition.isGroup || false
      };

      if (condition.joinOperator) {
        cleanCondition.joinOperator = condition.joinOperator;
      }

      if (cleanCondition.isGroup && condition.conditions) {
        cleanCondition.conditions = this.cleanConditions(condition.conditions);
      }

      return cleanCondition;
    });
  }
};