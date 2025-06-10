import ConditionService from "./condition.service";
import { ConditionDTO, JoinOperator, RuleDTO } from "./types";

export default {
	// Configuration
	DEPTH_LIMIT: 3,

	/**
	 * Creates a new empty rule with default structure
	 */
	createEmptyRule(): RuleDTO {
		return {
			name: "",
			conditions: [ConditionService.createEmptyCondition()],
			enabled: true,
		};
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
	 * Formats conditions into a human-readable expression
	 */
	formatReadableRule(conditions?: ConditionDTO[]): string {
		if (!conditions || conditions.length === 0) return "";

		let result = "";

		for (let i = 0; i < conditions.length; i++) {
			const condition = conditions[i];

			if (condition.isGroup && condition.conditions) {
				result += "(";
				result += this.formatReadableRule(condition.conditions);
				result += ")";
			} else {
				const field = condition.field ?? "";
				const op = condition.operator || "";
				const value = condition.value || "";

				// Format based on operator
				if (op === "starts_with" || op === "ends_with" || op === "~~") {
					const fnName = op === "~~" ? "contains" : op;
					result += `${fnName}(${field}, "${value}")`;
				} else {
					result += `${field} ${op} "${value}"`;
				}
			}

			// Add join operator if not last
			if (i < conditions.length - 1) {
				const nextJoin = conditions[i].joinOperator || JoinOperator.AND;
				result += ` ${nextJoin} `;
			}
		}

		return result;
	},

	/**
	 * Cleans a rule for API submission by removing UI-only properties
	 */
	cleanRuleForExport(rule: RuleDTO): RuleDTO {
		const cleanConditions = (conditions: ConditionDTO[]): ConditionDTO[] =>
			conditions.map((condition) => {
				const cleaned: ConditionDTO = {
					id: condition.id,
					field: condition.field,
					operator: condition.operator,
					value: condition.value,
					isGroup: condition.isGroup || false,
					conditions: [],
				};

				if (condition.joinOperator) {
					cleaned.joinOperator = condition.joinOperator;
				}

				if (condition.isGroup && condition.conditions) {
					cleaned.conditions = cleanConditions(condition.conditions);
				}

				return cleaned;
			});

		return {
			id: rule.id,
			name: rule.name,
			conditions: cleanConditions(rule.conditions),
			enabled: rule.enabled,
		};
	},

	/**
	 * Deep clones a rule object
	 */
	cloneRule(rule: RuleDTO): RuleDTO {
		return JSON.parse(JSON.stringify(rule));
	},

	/**
	 * Generates a unique ID for conditions/rules
	 */
	generateId(): string {
		return "_" + Math.random().toString(36).substring(2, 9);
	},

	/**
	 * Checks if conditions can have nested groups added (within depth limit)
	 */
	canAddNestedGroup(conditions: ConditionDTO[]): boolean {
		const currentDepth = this.calculateDepth(conditions);
		return currentDepth < this.DEPTH_LIMIT;
	},

	/**
	 * Optimizes rule structure by removing unnecessary nesting
	 */
	optimizeRuleStructure(rule: RuleDTO): RuleDTO {
		const optimized = this.cloneRule(rule);
		optimized.conditions = this.optimizeConditions(optimized.conditions);
		return optimized;
	},

	/**
	 * Optimizes conditions by flattening unnecessary groups
	 */
	optimizeConditions(conditions: ConditionDTO[]): ConditionDTO[] {
		return conditions.map((condition) => {
			if (condition.isGroup && condition.conditions) {
				// If group has only one condition, flatten it
				if (condition.conditions.length === 1) {
					const singleCondition = condition.conditions[0];
					return {
						...singleCondition,
						joinOperator: condition.joinOperator,
					};
				}

				// Recursively optimize nested conditions
				condition.conditions = this.optimizeConditions(
					condition.conditions
				);
			}

			return condition;
		});
	},

	/**
	 * Validates if a rule structure is valid for nesting operations
	 */
	validateStructureForOperation(
		conditions: ConditionDTO[],
		operation: "bracket" | "group"
	): { valid: boolean; message?: string } {
		const currentDepth = this.calculateDepth(conditions);

		if (currentDepth >= this.DEPTH_LIMIT) {
			return {
				valid: false,
				message: `Cannot perform ${operation} operation: Maximum nesting depth (${this.DEPTH_LIMIT}) reached`,
			};
		}

		if (operation === "bracket" && conditions.length < 2) {
			return {
				valid: false,
				message: "Need at least 2 conditions to add brackets",
			};
		}

		if (operation === "group" && conditions.length < 2) {
			return {
				valid: false,
				message: "Need at least 2 conditions to create a group",
			};
		}

		return { valid: true };
	},
};
