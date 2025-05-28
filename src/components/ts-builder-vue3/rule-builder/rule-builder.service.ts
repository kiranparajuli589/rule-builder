import ConditionService from "./condition.service";
import { ConditionDTO, JoinOperator, RuleDTO } from "./types";

export default {
	// Configuration
	DEPTH_LIMIT: 3,

	generateId(): string {
		return ConditionService.generateId();
	},

	createEmptyRule(): RuleDTO {
		return {
			name: "",
			conditions: [ConditionService.createEmptyCondition()],
			enabled: true,
		};
	},

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

	formatReadableRule(conditions: ConditionDTO[]): string {
		if (!conditions || conditions.length === 0) return "";

		let result = "";

		for (let i = 0; i < conditions.length; i++) {
			const condition = conditions[i];

			if (condition.isGroup && condition.conditions) {
				result += "(";
				result += this.formatReadableRule(condition.conditions);
				result += ")";
			} else {
				const field = condition.field || "";
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

	hasCircularDependency(conditions: ConditionDTO[]): boolean {
		// Check if the same field appears with conflicting conditions
		const fieldConditions = new Map<string, Set<string>>();

		const flatConditions = this.flattenConditions(conditions);

		for (const condition of flatConditions) {
			if (!condition.field || !condition.operator || condition.isGroup)
				continue;

			const key = `${condition.field}:${condition.operator}`;
			const existingValues = fieldConditions.get(key) || new Set();

			// Check for conflicting values on same field/operator
			if (
				condition.operator === "==" &&
				existingValues.size > 0 &&
				!existingValues.has(condition.value || "")
			) {
				return true; // Can't equal two different values
			}

			existingValues.add(condition.value || "");
			fieldConditions.set(key, existingValues);
		}

		return false;
	},

	requiresBrackets(conditions: ConditionDTO[]): boolean {
		if (conditions.length <= 2) return false;

		// Check if there are mixed operators
		const operators = new Set<JoinOperator>();

		for (let i = 0; i < conditions.length - 1; i++) {
			const joinOp = conditions[i].joinOperator;
			if (joinOp) operators.add(joinOp);
		}

		return operators.size > 1;
	},

	canAddNestedGroup(conditions: ConditionDTO[]): boolean {
		const currentDepth = this.calculateDepth(conditions);
		return currentDepth < this.DEPTH_LIMIT;
	},

	cleanRuleForExport(rule: RuleDTO): RuleDTO {
		const cleanConditions = (conditions: ConditionDTO[]): ConditionDTO[] =>
			conditions.map((condition) => {
				const cleaned: any = {
					field: condition.field,
					operator: condition.operator,
					value: condition.value,
					isGroup: condition.isGroup,
				};

				if (condition.joinOperator) {
					cleaned.joinOperator = condition.joinOperator;
				}

				if (condition.isGroup && condition.conditions) {
					cleaned.conditions = cleanConditions(condition.conditions);
				}

				// Remove id as it's only for UI
				return cleaned;
			});

		return {
			name: rule.name,
			conditions: cleanConditions(rule.conditions),
			enabled: rule.enabled,
		};
	},
};
