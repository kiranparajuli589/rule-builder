import { ConditionDTO, JoinOperator } from "@/domain/components/rule-builder";

export default {
	_formatSingleCondition(condition: ConditionDTO): string {
		const field = condition.field ?? "";
		const operator = condition.operator ?? "";
		const value = condition.value ?? "";

		return this._isSpecialOperator(operator)
			? this._formatSpecialOperator(operator, field, value)
			: this._formatStandardOperator(field, operator, value);
	},
	_isSpecialOperator(operator: string): boolean {
		return ["starts_with", "ends_with", "~~"].includes(operator);
	},
	_formatSpecialOperator(
		operator: string,
		field: string,
		value: string
	): string {
		const functionName = operator === "~~" ? "contains" : operator;
		return `${functionName}(${field}, "${value}")`;
	},
	_formatStandardOperator(
		field: string,
		operator: string,
		value: string
	): string {
		return `${field} ${operator} "${value}"`;
	},
	_getJoinOperator(condition: ConditionDTO): string {
		return condition.joinOperator ?? JoinOperator.AND;
	},
	formatReadableRule(conditions?: ConditionDTO[]): string {
		if (!conditions || conditions.length === 0) return "";

		return conditions
			.map((condition, index) => {
				const conditionText =
					condition.isGroup && condition.conditions
						? `(${this.formatReadableRule(condition.conditions)})`
						: this._formatSingleCondition(condition);

				const isLastCondition = index === conditions.length - 1;
				const joinOperator = isLastCondition
					? ""
					: ` ${this._getJoinOperator(condition)} `;

				return conditionText + joinOperator;
			})
			.join("");
	},
};
