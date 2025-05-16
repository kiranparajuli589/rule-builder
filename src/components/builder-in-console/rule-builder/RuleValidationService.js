export default {
  validateRule(rule) {
    const errors = [];

    // Check if rule exists
    if (!rule) {
      errors.push({ field: '', message: 'Rule is required' });
      return errors;
    }

    // Validate create pattern structure
    const createPatternErrors = this.validateCreatePattern(rule.create_pattern);
    errors.push(...createPatternErrors.map(err => ({
      ...err,
      field: `create_pattern.${err.field}`
    })));

    // Validate replace pattern structure (if it exists)
    if (rule.replace_pattern) {
      const replacePatternErrors = this.validateReplacePatternStructure(rule.replace_pattern);
      errors.push(...replacePatternErrors.map(err => ({
        ...err,
        field: `replace_pattern.${err.field}`
      })));
    }

    // Validate parameters structure (if they exist)
    if (rule.parameters) {
      const paramErrors = this.validateParametersStructure(rule.parameters);
      errors.push(...paramErrors.map(err => ({
        ...err,
        field: `parameters.${err.field}`
      })));
    }

    return errors;
  },

  // Validate create pattern structure
  validateCreatePattern(createPattern) {
    const errors = [];

    if (!createPattern) {
      errors.push({ field: '', message: 'Create pattern is required' });
      return errors;
    }

    if (!createPattern.conditions || createPattern.conditions.length === 0) {
      errors.push({ field: 'conditions', message: 'At least one condition is required' });
      return errors;
    }

    // Validate logical consistency
    const logicalErrors = this.validateLogicalConsistency(createPattern.conditions);
    errors.push(...logicalErrors);

    return errors;
  },

  // Validate logical consistency of expressions
  validateLogicalConsistency(conditions) {
    const errors = [];

    if (!conditions || conditions.length < 2) return errors;

    // Check for mixed operators
    const joinOperators = new Set();
    for (let i = 0; i < conditions.length - 1; i++) {
      const joinOp = conditions[i].joinOperator || '&&';
      joinOperators.add(joinOp);
    }

    if (joinOperators.size > 1 && conditions.length > 2) {
      errors.push({
        field: 'conditions',
        message: 'Mixed AND/OR operators must be grouped with brackets'
      });
    }

    // Check max nesting depth
    const maxDepth = this.calculateDepth(conditions);
    if (maxDepth > 3) {
      errors.push({
        field: 'conditions',
        message: 'Maximum nesting depth (3) exceeded'
      });
    }

    return errors;
  },

  // Calculate expression nesting depth
  calculateDepth(conditions) {
    if (!conditions || conditions.length === 0) return 0;

    let maxDepth = 0;
    for (const condition of conditions) {
      if (condition.isGroup && condition.conditions) {
        const groupDepth = 1 + this.calculateDepth(condition.conditions);
        maxDepth = Math.max(maxDepth, groupDepth);
      }
    }

    return maxDepth;
  },

  // Validate replace pattern structure (not field values)
  validateReplacePatternStructure(replacePattern) {
    const errors = [];

    if (!replacePattern) {
      errors.push({ field: '', message: 'Replace pattern is required' });
      return errors;
    }

    return errors;
  },

  // Validate parameters structure (not field values)
  validateParametersStructure(parameters) {
    const errors = [];

    if (!parameters || parameters.length === 0) {
      errors.push({ field: '', message: 'At least one parameter is required' });
      return errors;
    }

    return errors;
  }
};