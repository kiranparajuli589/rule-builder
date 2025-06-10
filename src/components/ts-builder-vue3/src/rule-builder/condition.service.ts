import { $t } from "@/core/plugins/fluent.ts";
import countries from "@/domain/constants/countries.json";

import {
	ConditionDTO,
	ConditionField,
	ConditionOperator,
	FieldDefinition,
	JoinOperator,
	OperatorDefinition,
} from "./types.ts";

export default {
	generateId(): string {
		return "_" + Math.random().toString(36).substring(2, 9);
	},

	createEmptyCondition(): ConditionDTO {
		return {
			id: this.generateId(),
			field: ConditionField.URI_PATH,
			operator: ConditionOperator.EQUALS,
			value: "",
			joinOperator: JoinOperator.AND,
			isGroup: false,
			conditions: [],
		};
	},

	createGroup(conditions: ConditionDTO[] = []): ConditionDTO {
		return {
			id: this.generateId(),
			isGroup: true,
			joinOperator: JoinOperator.AND,
			conditions:
				conditions.length > 0
					? conditions
					: [
							this.createEmptyCondition(),
							this.createEmptyCondition(),
						],
		};
	},

	getFields(): FieldDefinition[] {
		return [
			{
				label: $t("rule-builder.fields.uri-path"),
				value: ConditionField.URI_PATH,
				description: $t("rule-builder.fields.uri-path-description"),
				meta: {
					placeholder: "/api/v1/users",
					valueDescription: $t("rule-builder.fields.uri-path-hint"),
				},
				validate: (value: string) => {
					if (!value) return $t("validation.required");
					if (!value.startsWith("/"))
						return $t(
							"rule-builder.validation.path-must-start-with-slash"
						);
					if (!/^[a-zA-Z0-9/.\-_~%:;?&=#@]+$/.test(value)) {
						return $t("rule-builder.validation.path-invalid-chars");
					}
					if (value.length > 2048) {
						return $t("rule-builder.validation.path-too-long");
					}
					return undefined;
				},
			},
			{
				label: $t("rule-builder.fields.method"),
				value: ConditionField.METHOD,
				description: $t("rule-builder.fields.method-description"),
				meta: {
					type: "select",
					placeholder: $t("rule-builder.fields.method-placeholder"),
					options: [
						{ label: "GET", value: "GET" },
						{ label: "POST", value: "POST" },
						{ label: "PUT", value: "PUT" },
						{ label: "DELETE", value: "DELETE" },
						{ label: "PATCH", value: "PATCH" },
						{ label: "OPTIONS", value: "OPTIONS" },
					],
				},
			},
			{
				label: $t("rule-builder.fields.host"),
				value: ConditionField.HOST,
				description: $t("rule-builder.fields.host-description"),
				meta: {
					placeholder: "example.com",
					valueDescription: $t("rule-builder.fields.host-hint"),
				},
				validate: (value: string) => {
					if (!value) return $t("validation.required");
					// Basic hostname validation
					const hostnameRegex =
						/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?)*$/;
					if (!hostnameRegex.test(value)) {
						return $t("rule-builder.validation.invalid-hostname");
					}
					return undefined;
				},
			},
			{
				label: $t("rule-builder.fields.user-agent"),
				value: ConditionField.USER_AGENT,
				description: $t("rule-builder.fields.user-agent-description"),
				meta: {
					placeholder: "Mozilla/5.0...",
				},
			},
			{
				label: $t("rule-builder.fields.country"),
				value: ConditionField.COUNTRY,
				description: $t("rule-builder.fields.country-description"),
				meta: {
					type: "select",
					placeholder: $t("rule-builder.fields.country-placeholder"),
					options: this.getCountryOptions(),
				},
			},
			{
				label: $t("rule-builder.fields.status-code"),
				value: ConditionField.STATUS_CODE,
				description: $t("rule-builder.fields.status-code-description"),
				meta: {
					type: "number",
					placeholder: "200",
					min: 100,
					max: 599,
					step: 1,
					valueDescription: $t(
						"rule-builder.fields.status-code-hint"
					),
				},
				validate: (value: any) => {
					if (!value) return $t("validation.required");
					const num = parseInt(value, 10);
					if (isNaN(num))
						return $t("rule-builder.validation.must-be-number");
					if (num < 100 || num > 599)
						return $t("rule-builder.validation.status-code-range");
					return undefined;
				},
			},
		];
	},

	getOperators(): OperatorDefinition[] {
		return [
			{
				label: $t("rule-builder.operators.equals"),
				value: ConditionOperator.EQUALS,
				description: $t("rule-builder.operators.equals-description"),
			},
			{
				label: $t("rule-builder.operators.not-equals"),
				value: ConditionOperator.NOT_EQUALS,
				description: $t(
					"rule-builder.operators.not-equals-description"
				),
			},
			{
				label: $t("rule-builder.operators.contains"),
				value: ConditionOperator.CONTAINS,
				description: $t("rule-builder.operators.contains-description"),
			},
			{
				label: $t("rule-builder.operators.starts-with"),
				value: ConditionOperator.STARTS_WITH,
				description: $t(
					"rule-builder.operators.starts-with-description"
				),
			},
			{
				label: $t("rule-builder.operators.ends-with"),
				value: ConditionOperator.ENDS_WITH,
				description: $t("rule-builder.operators.ends-with-description"),
			},
		];
	},

	getJoinOperators() {
		return [
			{ label: $t("rule-builder.join.and"), value: JoinOperator.AND },
			{ label: $t("rule-builder.join.or"), value: JoinOperator.OR },
		];
	},

	getCountryOptions() {
		return countries.map((c) => ({
			value: c.code,
			label: c.name,
		}));
	},

	getFieldDefinition(field: ConditionField): FieldDefinition | undefined {
		return this.getFields().find((f) => f.value === field);
	},

	validateConditionValue(condition: ConditionDTO): string | undefined {
		if (!condition.field || condition.isGroup) return undefined;

		const fieldDef = this.getFieldDefinition(condition.field);
		if (!fieldDef) return undefined;

		if (fieldDef.validate) {
			return fieldDef.validate(condition.value);
		}

		if (!condition.value) {
			return $t("validation.required");
		}

		return undefined;
	},
};
