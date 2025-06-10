export enum JoinOperator {
	AND = "&&",
	OR = "||",
}

export enum ConditionField {
	URI_PATH = "req.uri.path",
	METHOD = "req.method",
	HOST = "req.headers.host",
	USER_AGENT = "req.headers.UserAgent",
	COUNTRY = "req.geo.country",
	STATUS_CODE = "res.status",
}

export enum ConditionOperator {
	EQUALS = "==",
	NOT_EQUALS = "!=",
	CONTAINS = "~~",
	STARTS_WITH = "starts_with",
	ENDS_WITH = "ends_with",
}

export interface ConditionDTO {
	id: string;
	field?: ConditionField;
	operator?: ConditionOperator;
	value?: string;
	joinOperator?: JoinOperator; // Only present when this condition/group joins with previous ones
	isGroup?: boolean;
	conditions: ConditionDTO[]; // Only meaningful for groups, but kept for UI consistency
}

export interface CreatePatternDTO {
	conditions: ConditionDTO[];
}

export interface RuleDTO {
	id?: string;
	name: string;
	create_pattern?: CreatePatternDTO;
	enabled?: boolean;
}

export interface ValidationError {
	field: string;
	message: string;
}

export interface FieldDefinition {
	label: string;
	value: ConditionField;
	description: string;
	meta?: {
		type?: "text" | "select" | "number";
		placeholder?: string;
		options?: Array<{ label: string; value: string }>;
		min?: number;
		max?: number;
		step?: number;
		valueDescription?: string;
	};
	validate?: (value?: string) => string | undefined;
}

export interface OperatorDefinition {
	label: string;
	value: ConditionOperator;
	description: string;
}
