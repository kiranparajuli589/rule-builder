import {
	type ConditionDTO,
	JoinOperator,
	type RuleDTO,
	type ValidationError,
} from "./types";

export default {
	/**
	 * Validates a complete rule and returns validation errors
	 */
	validateRule(rule: RuleDTO): ValidationError[] {
		const errors: ValidationError[] = [];

		// Validate rule name
		if (!rule.name || rule.name.trim() === "") {
			errors.push({
				field: "name",
				message: "Rule name is required",
			});
		} else if (rule.name.length < 3) {
			errors.push({
				field: "name",
				message: "Rule name must be at least 3 characters",
			});
		}

		// Validate conditions structure
		if (!rule.conditions || rule.conditions.length === 0) {
			errors.push({
				field: "conditions",
				message: "At least one condition is required",
			});
		} else {
			// Validate individual conditions
			const conditionErrors = this.validateConditions(rule.conditions);
			errors.push(...conditionErrors);

			// Validate logical structure
			const logicalErrors = this.validateLogicalStructure(
				rule.conditions
			);
			errors.push(...logicalErrors);

			// Validate depth limit
			const depthErrors = this.validateDepthLimit(rule.conditions);
			errors.push(...depthErrors);
		}

		return errors;
	},

	/**
	 * Validates individual conditions recursively
	 */
	validateConditions(
		conditions: ConditionDTO[],
		path: string = "conditions"
	): ValidationError[] {
		const errors: ValidationError[] = [];

		conditions.forEach((condition, index) => {
			const conditionPath = `${path}[${index}]`;

			if (condition.isGroup) {
				// Validate group structure
				if (
					!condition.conditions ||
					condition.conditions.length === 0
				) {
					errors.push({
						field: conditionPath,
						message: "Group must contain at least one condition",
					});
				} else {
					// Recursively validate group conditions
					const groupErrors = this.validateConditions(
						condition.conditions,
						`${conditionPath}.conditions`
					);
					errors.push(...groupErrors);
				}
			} else {
				// Validate regular condition
				if (!condition.field) {
					errors.push({
						field: `${conditionPath}.field`,
						message: "Field is required",
					});
				}

				if (!condition.operator) {
					errors.push({
						field: `${conditionPath}.operator`,
						message: "Operator is required",
					});
				}

				if (!condition.value || condition.value.trim() === "") {
					errors.push({
						field: `${conditionPath}.value`,
						message: "Value is required",
					});
				}
			}
		});

		return errors;
	},

	/**
	 * Validates logical structure and operator consistency
	 */
	validateLogicalStructure(conditions: ConditionDTO[]): ValidationError[] {
		const errors: ValidationError[] = [];

		if (conditions.length < 2) return errors;

		// Check for mixed operators without proper grouping
		const operators = new Set<JoinOperator>();

		for (let i = 0; i < conditions.length - 1; i++) {
			const joinOp = conditions[i].joinOperator;
			if (joinOp) operators.add(joinOp);
		}

		// If we have mixed operators and more than 2 conditions, suggest bracketing
		if (operators.size > 1 && conditions.length > 2) {
			errors.push({
				field: "conditions",
				message:
					"Mixed AND/OR operators should be grouped with brackets for clarity",
			});
		}

		// Check for circular dependencies (same field with conflicting values)
		const circularErrors = this.validateCircularDependencies(conditions);
		errors.push(...circularErrors);

		return errors;
	},

	/**
	 * Validates circular dependencies in conditions
	 */
	validateCircularDependencies(
		conditions: ConditionDTO[]
	): ValidationError[] {
		const errors: ValidationError[] = [];
		const fieldConditions = new Map<string, Set<string>>();

		const flatConditions = this.flattenConditions(conditions);

		for (const condition of flatConditions) {
			if (!condition.field || !condition.operator || condition.isGroup)
				continue;

			const key = `${condition.field}:${condition.operator}`;
			const existingValues = fieldConditions.get(key) || new Set();

			// Check for conflicting equals conditions
			if (
				condition.operator === "==" &&
				existingValues.size > 0 &&
				!existingValues.has(condition.value || "")
			) {
				errors.push({
					field: "conditions",
					message: `Conflicting conditions: ${condition.field} cannot equal multiple different values`,
				});
			}

			existingValues.add(condition.value || "");
			fieldConditions.set(key, existingValues);
		}

		return errors;
	},

	/**
	 * Validates depth limit is not exceeded
	 */
	validateDepthLimit(
		conditions: ConditionDTO[],
		maxDepth: number = 3
	): ValidationError[] {
		const errors: ValidationError[] = [];
		const currentDepth = this.calculateDepth(conditions);

		if (currentDepth > maxDepth) {
			errors.push({
				field: "conditions",
				message: `Rule nesting depth (${currentDepth}) exceeds maximum allowed depth (${maxDepth})`,
			});
		}

		return errors;
	},

	/**
	 * Calculates the maximum nesting depth of conditions
	 */
	calculateDepth(conditions: ConditionDTO[]): number {
		if (!conditions || conditions.length === 0) return 0;

		let maxDepth = 0;
		for (const condition of conditions) {
			if (condition.isGroup && condition.conditions) {
				const groupDepth =
					1 + this.calculateDepth(condition.conditions);
				maxDepth = Math.max(maxDepth, groupDepth);
			}
		}

		return maxDepth;
	},

	/**
	 * Flattens nested conditions into a single array
	 */
	flattenConditions(conditions: ConditionDTO[]): ConditionDTO[] {
		const result: ConditionDTO[] = [];

		for (const condition of conditions) {
			if (condition.isGroup && condition.conditions) {
				result.push(...this.flattenConditions(condition.conditions));
			} else {
				result.push(condition);
			}
		}

		return result;
	},

	/**
	 * Checks if conditions require brackets for mixed operators
	 */
	requiresBrackets(conditions: ConditionDTO[]): boolean {
		if (conditions.length <= 2) return false;

		const operators = new Set<JoinOperator>();

		for (let i = 0; i < conditions.length - 1; i++) {
			const joinOp = conditions[i].joinOperator;
			if (joinOp) operators.add(joinOp);
		}

		return operators.size > 1;
	},

	/**
	 * Checks if there are circular dependencies in the conditions
	 */
	hasCircularDependency(conditions: ConditionDTO[]): boolean {
		const fieldConditions = new Map<string, Set<string>>();
		const flatConditions = this.flattenConditions(conditions);

		for (const condition of flatConditions) {
			if (!condition.field || !condition.operator || condition.isGroup)
				continue;

			const key = `${condition.field}:${condition.operator}`;
			const existingValues = fieldConditions.get(key) || new Set();

			if (
				condition.operator === "==" &&
				existingValues.size > 0 &&
				!existingValues.has(condition.value || "")
			) {
				return true;
			}

			existingValues.add(condition.value || "");
			fieldConditions.set(key, existingValues);
		}

		return false;
	},
};
