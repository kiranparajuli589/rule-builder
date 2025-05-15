import ConditionService from './ConditionService.js';

export default {
  DEPTH_LIMIT: 3, // Maximum nesting depth allowed

  get fields() {
    return ConditionService.fields;
  },

  get operators() {
    return ConditionService.operators;
  },

  get joinOperators() {
    return ConditionService.joinOperators;
  },

  get rewriteFunctions() {
    return ConditionService.rewriteFunctions;
  },

  // Improved calculateDepth method that counts the current nesting depth correctly
  calculateDepth(conditions) {
    if (!conditions || conditions.length === 0) return 0;

    let maxDepth = 0;

    for (const condition of conditions) {
      if (condition.isGroup && condition.conditions) {
        // For each group, calculate its depth recursively and add 1
        const groupDepth = 1 + this.calculateDepth(condition.conditions);
        maxDepth = Math.max(maxDepth, groupDepth);
      }
    }

    return maxDepth;
  },

  // Calculate effective depth taking into account the current nesting level
  calculateEffectiveDepth(conditions, currentLevel = 0) {
    return currentLevel + this.calculateDepth(conditions);
  },

  // Check if adding a group at the given location would exceed the depth limit
  wouldExceedDepthLimit(conditions, nestingLevel = 0) {
    // If we're already at the limit, adding more would exceed it
    if (nestingLevel >= this.DEPTH_LIMIT) return true;

    // Calculate the current max depth and add 1 for the new level we want to add
    const currentMaxDepth = this.calculateDepth(conditions);
    return (nestingLevel + currentMaxDepth + 1) > this.DEPTH_LIMIT;
  },

  // Find and report the deepest group in a rule
  findDeepestGroup(conditions, currentPath = [], deepestPath = { path: [], depth: 0 }) {
    if (!conditions || conditions.length === 0) return deepestPath;

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const newPath = [...currentPath, i];

      if (condition.isGroup && condition.conditions) {
        // Calculate this group's depth
        const groupDepth = 1 + this.calculateDepth(condition.conditions);

        // Update deepest path if this is deeper
        if (groupDepth > deepestPath.depth) {
          deepestPath = { path: newPath, depth: groupDepth };
        }

        // Recursively check this group's conditions
        deepestPath = this.findDeepestGroup(condition.conditions, [...newPath, 'conditions'], deepestPath);
      }
    }

    return deepestPath;
  },

  // Safely enforce the depth limit on an existing rule
  enforceDepthLimit(rule) {
    if (!rule || !rule.create_pattern || !rule.create_pattern.conditions) {
      return rule;
    }

    // Make a copy to avoid modifying the original
    const ruleCopy = JSON.parse(JSON.stringify(rule));
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // Safety mechanism to prevent infinite loops

    // Keep simplifying the deepest groups until we're within the limit
    while (this.calculateDepth(ruleCopy.create_pattern.conditions) > this.DEPTH_LIMIT && attempts < MAX_ATTEMPTS) {
      // Find the path to the deepest group
      const deepestInfo = this.findDeepestGroup(ruleCopy.create_pattern.conditions);

      // No deep groups found or can't determine path
      if (!deepestInfo.path || deepestInfo.path.length === 0) break;

      console.log(`Simplifying deepest group at depth ${deepestInfo.depth}`);

      // Simplify the structure by flattening the deepest group
      this.simplifyDeepestGroup(ruleCopy.create_pattern.conditions, deepestInfo.path);

      attempts++; // Increment attempt counter
    }

    // If we still exceed the depth limit after MAX_ATTEMPTS, log a warning
    if (this.calculateDepth(ruleCopy.create_pattern.conditions) > this.DEPTH_LIMIT) {
      console.warn(`Failed to enforce depth limit after ${MAX_ATTEMPTS} attempts. Rule is too complex.`);
    }

    return ruleCopy;
  },

  // Helper method to simplify the deepest group by removing one level of nesting
  simplifyDeepestGroup(conditions, path) {
    // Navigate to the group using the path
    let current = conditions;
    let parent = null;
    let parentIndex = -1;

    // Navigate to the deepest group
    for (let i = 0; i < path.length - 1; i++) {
      parent = current;
      parentIndex = path[i];

      if (typeof parentIndex !== 'number' || !parent[parentIndex]) {
        console.warn('Invalid path while simplifying deep group', path);
        return; // Early return if path is invalid
      }

      current = parent[parentIndex];

      if (current.conditions && i < path.length - 2) {
        current = current.conditions;
      }
    }

    // If we found a valid group, simplify it
    if (current && current.isGroup && current.conditions) {
      // Replace this group with its first condition, and keep the join operator
      const firstCondition = current.conditions[0];
      const joinOp = current.joinOperator;

      if (current.conditions.length === 1) {
        // If there's only one condition, just replace the group with it
        parent[parentIndex] = firstCondition;
      } else {
        // If there are multiple conditions, flatten them by bringing them up one level
        // We'll remove the current group and insert its conditions
        const groupConditions = [...current.conditions];

        // Set the join operator for the first condition
        if (groupConditions[0].isGroup) {
          groupConditions[0].joinOperator = joinOp;
        }

        // Remove the current group
        parent[parentIndex] = groupConditions[0];

        // Insert the remaining conditions after the current position
        for (let i = 1; i < groupConditions.length; i++) {
          parent.splice(parentIndex + i, 0, groupConditions[i]);
        }
      }
    }
  },

  // Format rule with function-style syntax
  formatReadableRule(conditions, joinOperators) {
    if (!conditions || conditions.length === 0) return '';

    let result = '';
    const localJoinOps = joinOperators || [];

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];

      if (condition.isGroup) {
        // Add opening bracket for group
        result += '(';
        // Format the group's conditions
        result += this.formatReadableRule(condition.conditions, Array(condition.conditions.length - 1).fill(condition.joinOperator || '&&'));
        // Add closing bracket
        result += ')';
      } else {
        // Format single condition with function-style syntax for certain operators
        const valueDisplay = condition.value !== undefined ? `"${condition.value}"` : 'undefined';

        if (condition.operator === 'starts_with' || condition.operator === 'ends_with' ||
          condition.operator === '~~' || condition.operator === 'contains') {
          // Use function-style syntax for these operators
          const fnName = condition.operator === '~~' ? 'contains' : condition.operator;
          result += `${fnName}(${condition.field}, ${valueDisplay})`;
        } else {
          // Regular comparison operators use standard syntax
          result += `${condition.field} ${condition.operator} ${valueDisplay}`;
        }
      }

      // Add join operator if not the last condition
      if (i < conditions.length - 1) {
        result += ` ${localJoinOps[i] || '&&'} `;
      }
    }

    return result;
  },

  formatReadableReplacePattern(pattern) {
    if (!pattern || !pattern.field) return '';

    if (pattern.withFn) {
      return `${pattern.fn ?? "_"}(${pattern.field}, "${pattern.fnArg}")`;
    } else if (pattern.value !== undefined) {
      return `${pattern.field} = "${pattern.value}"`;
    }

    return '';
  },

  formatReadableParametersList(parameters) {
    if (!parameters || parameters.length === 0) return '';

    return parameters.map(param =>
      `${param.name} = "${param.value}"`
    ).join(', ');
  },

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
  },

  newCondition() {
    return {
      id: this.generateId(),
      field: 'req.uri.path',
      operator: '==',
      value: '',
      isGroup: false
    };
  },

  newParameter() {
    return {
      name: '',
      value: ''
    };
  },

  initializeRule() {
    return {
      create_pattern: {
        conditions: [this.newCondition()]
      },
      replace_pattern: {
        field: 'req.uri.path',
        value: '',
        withFn: false
      }
    };
  },

  initializeParameterRule() {
    return {
      create_pattern: {
        conditions: [this.newCondition()]
      },
      parameters: [this.newParameter()]
    };
  },

  validateRule(rule, replacePatternType = 'standard') {
    // Basic validation
    const createPattern = rule.create_pattern;

    // Check if create pattern has at least one condition
    if (!createPattern.conditions || createPattern.conditions.length === 0) {
      alert('Create pattern must have at least one condition.');
      return false;
    }

    // Check if all conditions have values
    for (const condition of this.flattenConditions(createPattern.conditions)) {
      if (!condition.isGroup && (!condition.field || !condition.operator || condition.value === '')) {
        alert('All conditions must have field, operator, and value.');
        return false;
      }
    }

    // Check if the rule exceeds the depth limit
    const depth = this.calculateDepth(createPattern.conditions);
    if (depth > this.DEPTH_LIMIT) {
      alert(`Rule exceeds maximum nesting depth of ${this.DEPTH_LIMIT} levels. Please simplify your rule.`);
      return false;
    }

    // Check logical structure validity
    if (!this.validateLogicalStructure(rule, createPattern.conditions)) {
      return false;
    }

    // Type-specific validation
    if (replacePatternType === 'standard') {
      // Check standard replace pattern
      const replacePattern = rule.replace_pattern;

      if (!replacePattern || !replacePattern.field) {
        alert('Replace pattern must have a field.');
        return false;
      }

      if (replacePattern.withFn) {
        if (!replacePattern.fn || !replacePattern.fnArg) {
          alert('Replace pattern with function must have both function and function argument.');
          return false;
        }
      } else if (replacePattern.value === undefined) {
        alert('Replace pattern must have a value.');
        return false;
      }
    } else if (replacePatternType === 'parameters') {
      // Check parameters
      const parameters = rule.parameters;

      if (!parameters || parameters.length === 0) {
        alert('At least one parameter is required.');
        return false;
      }

      for (const param of parameters) {
        if (!param.name || !param.value) {
          alert('All parameters must have name and value.');
          return false;
        }
      }
    }

    return true;
  },

  validateLogicalStructure(rule, conditions) {
    // If there are more than 2 conditions without proper grouping, it's invalid
    if (conditions.length > 2) {
      // Count non-grouped conditions
      const nonGroupedCount = conditions.filter(c => !c.isGroup).length;

      if (nonGroupedCount > 1) {
        alert('Invalid logical structure. You cannot have more than 1 non-grouped condition when there are 3 or more total conditions.');
        return false;
      }
    }

    // Check for mixed operators without brackets
    if (conditions.length > 1) {
      const joinOperators = conditions.length > 0 && conditions[0].isGroup ?
        [conditions[0].joinOperator] :
        rule.create_pattern.joinOperators || [];

      const hasAnd = joinOperators.includes('&&');
      const hasOr = joinOperators.includes('||');

      if (hasAnd && hasOr) {
        alert('Mixed AND/OR operators detected without proper bracketing. Please add brackets to clarify precedence.');
        return false;
      }
    }

    // Check for empty values in non-group conditions
    for (const condition of conditions) {
      if (!condition.isGroup && condition.value === '') {
        alert('All conditions must have a value.');
        return false;
      }

      // Recursively check groups
      if (condition.isGroup && condition.conditions) {
        // Check if this group has too many non-grouped conditions
        if (condition.conditions.length > 2) {
          const nestedNonGroupedCount = condition.conditions.filter(c => !c.isGroup).length;

          if (nestedNonGroupedCount > 1) {
            alert('Invalid group structure. You cannot have more than 1 non-grouped condition in a group with 3 or more total conditions.');
            return false;
          }
        }

        if (!this.validateLogicalStructure(rule, condition.conditions)) {
          return false;
        }
      }
    }

    return true;
  },

  flattenConditions(conditions) {
    let flat = [];
    for (const condition of conditions) {
      if (condition.isGroup && condition.conditions) {
        flat = flat.concat(this.flattenConditions(condition.conditions));
      } else {
        flat.push(condition);
      }
    }
    return flat;
  },

  // Reset a rule that has become too complex to a simpler state
  resetComplexRule() {
    return this.initializeRule();
  }
};