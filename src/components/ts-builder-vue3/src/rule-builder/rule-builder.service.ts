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
			create_pattern: {
				conditions: [ConditionService.createEmptyCondition()],
			}, // First condition has no joinOperator
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
	 * Cleans a rule for API submission by removing UI-only properties
	 */
	cleanRuleForExport(rule: RuleDTO): RuleDTO {
		const cleanConditions = (conditions: ConditionDTO[]): ConditionDTO[] =>
			conditions.map((condition) =>
				ConditionService.cleanCondition(condition)
			);

		return {
			id: rule.id,
			name: rule.name,
			enabled: rule.enabled,
			create_pattern: {
				conditions: cleanConditions(
					rule.create_pattern?.conditions ?? []
				),
			},
		};
	},

	/**
	 * Deep clones a rule object
	 */
	cloneRule(rule: RuleDTO): RuleDTO {
		return JSON.parse(JSON.stringify(rule));
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

	/**
	 * Properly adds join operators to conditions
	 * First condition in any level should not have joinOperator
	 * Subsequent conditions should have joinOperator
	 */
	normalizeJoinOperators(conditions: ConditionDTO[]): ConditionDTO[] {
		return conditions.map((condition, index) => {
			const normalized = { ...condition };

			if (index === 0) {
				// First condition should not have joinOperator
				delete normalized.joinOperator;
			} else {
				// Subsequent conditions should have joinOperator
				normalized.joinOperator =
					condition.joinOperator ?? JoinOperator.AND;
			}

			// Recursively normalize nested conditions
			if (condition.isGroup && condition.conditions) {
				normalized.conditions = this.normalizeJoinOperators(
					condition.conditions
				);
			}

			return normalized;
		});
	},
};
