import ConditionService from "./condition.service.ts";
import { ConditionDTO, JoinOperator, RuleDTO } from "./types.ts";

export default {
	// Configuration
	DEPTH_LIMIT: 3,

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
