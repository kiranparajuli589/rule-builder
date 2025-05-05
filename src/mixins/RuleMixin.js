import RuleService from "@//services/RuleService.js";

export const RuleMixin = {
  data() {
    return {
      localConditions: [],
      joinOperators: [],
      isProcessingAutomatic: false, // Flag to prevent infinite recursion
      depthCheckInProgress: false, // Flag to prevent nested depth check calls
    }
  },
  watch: {
    localConditions: {
      handler() {
        if (!this.isProcessingAutomatic) {
          this.checkAndApplyBrackets();
        }

        // Check depth on condition changes, but avoid recursive calls
        if (!this.depthCheckInProgress) {
          this.checkDepthExceeded();
        }

        this.$emit('update:conditions', this.localConditions);
      },
      deep: true
    }
  },
  methods: {
    // Check if the current conditions exceed depth limit
    checkDepthExceeded() {
      this.depthCheckInProgress = true;

      try {
        const currentDepth = RuleService.calculateDepth(this.localConditions);
        if (currentDepth > RuleService.DEPTH_LIMIT) {
          console.warn(`Depth limit exceeded in RuleMixin. Current: ${currentDepth}, Limit: ${RuleService.DEPTH_LIMIT}`);
          this.enforceDepthLimit();
        }
      } finally {
        // Always reset the flag
        this.$nextTick(() => {
          this.depthCheckInProgress = false;
        });
      }
    },

    // Apply depth limit enforcement
    enforceDepthLimit() {
      if (this.isProcessingAutomatic) return;

      this.isProcessingAutomatic = true;

      try {
        // Create a copy of conditions to work with
        let simplifiedConditions = JSON.parse(JSON.stringify(this.localConditions));

        // Apply simplification - max 3 attempts to prevent freezing
        for (let i = 0; i < 3; i++) {
          const deepestInfo = RuleService.findDeepestGroup(simplifiedConditions);

          if (!deepestInfo.path || deepestInfo.path.length === 0 ||
            deepestInfo.depth <= RuleService.DEPTH_LIMIT) {
            break;
          }

          RuleService.simplifyDeepestGroup(simplifiedConditions, deepestInfo.path);
        }

        // Check if simplification was successful
        if (RuleService.calculateDepth(simplifiedConditions) <= RuleService.DEPTH_LIMIT) {
          this.localConditions = simplifiedConditions;
        }
      } catch (error) {
        console.error('Error enforcing depth limit in mixin:', error);
      } finally {
        // Reset processing flag
        this.$nextTick(() => {
          this.isProcessingAutomatic = false;
        });
      }
    },

    initializeFromProps() {
      this.localConditions = JSON.parse(JSON.stringify(this.conditions || []));

      // Initialize join operators
      this.joinOperators = [];
      for (let i = 0; i < this.localConditions.length - 1; i++) {
        this.joinOperators.push('&&'); // Default to AND
      }

      // Ensure at least one condition exists
      if (this.localConditions.length === 0) {
        this.addCondition();
      }

      // Check depth right at initialization
      this.checkDepthExceeded();
    },

    hasOnlyGroups() {
      // Check if all conditions are already groups
      return this.localConditions.length > 0 && this.localConditions.every(cond => cond.isGroup);
    },

    addCondition() {
      // Only add a condition if we have fewer than 2 non-grouped conditions
      const nonGroupedCount = this.localConditions.filter(c => !c.isGroup).length;

      if (nonGroupedCount < 2) {
        // Just add the condition normally
        this.localConditions.push(RuleService.newCondition());

        if (this.localConditions.length > 1) {
          this.joinOperators.push('&&');
        }
      }
    },

    addGroup() {
      // Check if adding a group would exceed depth limit
      if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
        alert(`Cannot add group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      if (this.localConditions.length >= 1) {
        // If we already have conditions, create a group with the last condition and a new one
        const lastCondition = this.localConditions[this.localConditions.length - 1];

        // Remove the last condition
        this.localConditions.pop();

        // Also remove the last join operator if there is one
        if (this.joinOperators.length > 0) {
          this.joinOperators.pop();
        }

        // Create a new group with the last condition and a new empty one
        const newGroup = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            JSON.parse(JSON.stringify(lastCondition)),
            RuleService.newCondition(),
          ]
        };

        // Add the new group
        this.localConditions.push(newGroup);
      } else {
        // Just add a new group with two empty conditions
        this.localConditions.push({
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: '&&',
          conditions: [
            RuleService.newCondition(),
            RuleService.newCondition()
          ]
        });
      }

      // Add a join operator if needed
      if (this.localConditions.length > 1) {
        this.joinOperators.push('&&');
      }

      // Check depth after adding group
      this.checkDepthExceeded();
    },

    bracketExistingConditions() {
      // Check if bracketing would exceed depth limit
      if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
        alert(`Cannot bracket conditions - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Create a group from all existing conditions
      const groupedConditions = {
        id: RuleService.generateId(),
        isGroup: true,
        joinOperator: this.joinOperators[0] || '&&',
        conditions: JSON.parse(JSON.stringify(this.localConditions))
      };

      // Replace existing conditions with the group
      this.localConditions = [groupedConditions];
      this.joinOperators = [];

      // Automatically add a new empty condition
      this.localConditions.push(RuleService.newCondition());

      // Add join operator
      this.joinOperators.push('&&');

      // Check depth after bracketing
      this.checkDepthExceeded();
    },

    removeCondition(index) {
      this.localConditions.splice(index, 1);

      // Update join operators array
      if (index < this.joinOperators.length) {
        this.joinOperators.splice(index, 1);
      } else if (this.joinOperators.length > 0) {
        this.joinOperators.pop();
      }

      // Ensure at least one condition exists
      if (this.localConditions.length === 0) {
        this.addCondition();
      }
    },

    updateJoinOperator(index, newValue) {
      this.joinOperators[index] = newValue;

      const hasAnd = this.joinOperators.includes('&&');
      const hasOr = this.joinOperators.includes('||');

      // Check if we need to trigger automatic bracketing
      if (hasAnd && hasOr && this.localConditions.length > 2) {
        this.automaticBracketing();
      }
    },

    automaticBracketing() {
      // Check if adding a group would exceed depth limit
      if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
        console.warn(`Cannot apply automatic bracketing - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // If we have 3 conditions, auto-bracket the first two
      if (this.localConditions.length === 3) {
        // Group first two conditions
        const groupedConditions = {
          id: RuleService.generateId(),
          isGroup: true,
          joinOperator: this.joinOperators[0],
          conditions: [
            JSON.parse(JSON.stringify(this.localConditions[0])),
            JSON.parse(JSON.stringify(this.localConditions[1]))
          ]
        };

        // Create new conditions array with the group and the third condition
        const thirdCondition = this.localConditions[2];
        this.localConditions = [
          groupedConditions,
          thirdCondition
        ];

        // Update join operators
        if (this.joinOperators.length > 1) {
          this.joinOperators = [this.joinOperators[1]];
        } else {
          this.joinOperators = ['&&'];
        }
      }
    },

    checkAndApplyBrackets() {
      // Set flag to prevent recursive processing
      if (this.isProcessingAutomatic) return;

      this.isProcessingAutomatic = true;

      try {
        // Auto-add brackets when there are more than 2 conditions with mixed operators
        if (this.localConditions.length >= 3) {
          const hasAnd = this.joinOperators.includes('&&');
          const hasOr = this.joinOperators.includes('||');

          if (hasAnd && hasOr) {
            // Find sequences that need brackets
            for (let i = 0; i < this.joinOperators.length - 1; i++) {
              const currentOp = this.joinOperators[i];
              const nextOp = this.joinOperators[i + 1];

              if (currentOp !== nextOp) {
                // We have a mixed sequence of operators, check if we already have a group
                if (!this.hasGroupForSequence(i, i + 2)) {
                  // Check depth limit before converting to group
                  if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
                    console.warn(`Cannot apply automatic bracketing - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
                    return;
                  }

                  // Create a group for these two conditions
                  this.convertToGroup(i, i + 2);
                  break; // Only handle one conversion at a time
                }
              }
            }
          }
        }

        // Check for unbracketed condition sequences longer than 2 and enforce bracketing
        if (this.localConditions.length > 2) {
          // Count number of consecutive non-grouped conditions
          let consecutiveCount = 0;
          let consecutiveStart = -1;

          for (let i = 0; i < this.localConditions.length; i++) {
            if (!this.localConditions[i].isGroup) {
              if (consecutiveStart === -1) {
                consecutiveStart = i;
              }
              consecutiveCount++;
            } else {
              // Reset counter when encountering a group
              if (consecutiveCount > 2) {
                // We found more than 2 consecutive non-grouped conditions
                this.warnAboutUnbracketedConditions(consecutiveStart, consecutiveCount);
                return;
              }
              consecutiveCount = 0;
              consecutiveStart = -1;
            }
          }

          // Check final sequence
          if (consecutiveCount > 2) {
            this.warnAboutUnbracketedConditions(consecutiveStart, consecutiveCount);
          }
        }
      } finally {
        // Always reset the flag when done
        this.$nextTick(() => {
          this.isProcessingAutomatic = false;
        });
      }
    },

    hasGroupForSequence(startIndex, endIndex) {
      // Check if there's already a group covering this sequence
      return this.localConditions.some(cond =>
        cond.isGroup &&
        cond.originalStartIndex === startIndex &&
        cond.originalEndIndex === endIndex
      );
    },

    convertToGroup(startIndex, endIndex) {
      // Check depth limit before converting to group
      if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
        console.warn(`Cannot convert to group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Create a new group from the conditions between startIndex and endIndex
      const conditionsToGroup = this.localConditions.slice(startIndex, endIndex);
      const joinOpsToGroup = this.joinOperators.slice(startIndex, endIndex - 1);

      // Create the new group
      const newGroup = {
        id: RuleService.generateId(),
        isGroup: true,
        joinOperator: joinOpsToGroup[0], // Use the first join operator for the group
        conditions: JSON.parse(JSON.stringify(conditionsToGroup)),
        originalStartIndex: startIndex,
        originalEndIndex: endIndex
      };

      // Remove the old conditions and join operators
      this.localConditions.splice(startIndex, endIndex - startIndex);
      this.joinOperators.splice(startIndex, endIndex - startIndex - 1);

      // Insert the new group
      this.localConditions.splice(startIndex, 0, newGroup);

      // Check depth after conversion
      this.checkDepthExceeded();
    },

    warnAboutUnbracketedConditions(startIndex, count) {
      // Check depth limit before applying bracketing
      if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
        console.warn(`Cannot apply automatic bracketing - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`);
        return;
      }

      // Only apply bracketing if we haven't already prompted
      if (!this.hasPromptedForBracketing) {
        this.hasPromptedForBracketing = true;

        // Create groups of two conditions moving forward
        let remaining = count;
        let currentIndex = startIndex;

        while (remaining >= 2) {
          // Check depth limit before each iteration
          if (RuleService.wouldExceedDepthLimit(this.localConditions)) {
            console.warn('Reached depth limit during auto-bracketing, stopping');
            break;
          }

          // Take two conditions at a time and group them
          const twoConditions = this.localConditions.slice(currentIndex, currentIndex + 2);

          // Skip if we don't have enough conditions
          if (twoConditions.length < 2) break;

          const joinOp = this.joinOperators[currentIndex] || '&&';

          // Create a group for these two
          const groupedConditions = {
            id: RuleService.generateId(),
            isGroup: true,
            joinOperator: joinOp,
            conditions: JSON.parse(JSON.stringify(twoConditions))
          };

          // Replace in the array
          this.localConditions.splice(currentIndex, 2, groupedConditions);

          // Update join operators array if needed
          if (currentIndex < this.joinOperators.length) {
            this.joinOperators.splice(currentIndex, 1);
          }

          // Update counters - only subtract 1 since we replaced 2 with 1
          remaining -= 1;
        }
      }
    }
  }
}