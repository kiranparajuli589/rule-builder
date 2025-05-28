import { RuleDTO } from "@/domain/dtos/plugins";

export const RuleBuilderInject = "RULE_BUILDER_INJECT";

export type ValidationError = {
	field: string;
	message: string;
};

export enum JoinOperator {
	AND = "AND",
	OR = "OR",
}

export enum ConditionFields {
	METHOD = "req.method",
	PATH = "req.path",
	AGENT = "req.agent",
	REFERER = "req.referer",
	COUNTRY = "req.geo.country",
	STATUS = "res.status",
}

export enum ConditionOperators {
	EQUAL = "==",
	NOT_EQUAL = "~=",
	REGULAR_MATCH = "~~",
	CASE_INSENSITIVE_REGULAR_MATCH = "~*",
	REVERSE_RESULT = "!",
}

export type RuleBuilderState = {
	open: boolean;
	rule: RuleDTO;
	index: number;
	errors: ValidationError[];
	setState: (state: RuleBuilderState) => void;
};

export type ConditionDTO = {
	field?: ConditionFields;
	operator?: ConditionOperators;
	value?: string;
	joinOperator: JoinOperator;
	isGroup?: boolean;
	id: string;
	conditions?: ConditionDTO[]; // For nested conditions
};

export type RuleExpressionDTO = {
	conditions: ConditionDTO[];
};
